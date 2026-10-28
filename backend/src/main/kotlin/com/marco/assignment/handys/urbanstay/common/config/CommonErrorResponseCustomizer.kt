package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorResponseFactory
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.ErrorResponse
import io.swagger.v3.core.converter.AnnotatedType
import io.swagger.v3.core.converter.ModelConverters
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.PathItem
import io.swagger.v3.oas.models.SpecVersion
import io.swagger.v3.oas.models.examples.Example
import io.swagger.v3.oas.models.media.Content
import io.swagger.v3.oas.models.media.MediaType
import io.swagger.v3.oas.models.media.Schema
import org.springdoc.core.customizers.GlobalOpenApiCustomizer
import org.springdoc.core.properties.SpringDocConfigProperties
import org.springdoc.core.utils.SpringDocAnnotationsUtils
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import tools.jackson.databind.json.JsonMapper
import io.swagger.v3.oas.models.responses.ApiResponse as OpenApiResponse

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CommonErrorResponseCustomizer(
	private val errorResponseFactory: ErrorResponseFactory,
	private val jsonMapper: JsonMapper,
	private val springDocConfigProperties: SpringDocConfigProperties,
) : GlobalOpenApiCustomizer {

	override fun customise(openApi: OpenAPI) {
		val components = openApi.components ?: Components().also { openApi.components = it }
		components.addSchemas(ERROR_SCHEMA_NAME, errorSchema(components, openApi.specVersion))
		openApi.paths.orEmpty().forEach { (path, pathItem) ->
			pathItem.readOperationsMap().forEach { (method, operation) ->
				errorCodes(path, method).groupBy { it.status }.forEach { (status, codes) ->
					operation.responses.putIfAbsent(status.value().toString(), errorResponse(status, codes))
				}
			}
		}
	}

	private fun errorCodes(path: String, method: PathItem.HttpMethod): List<ErrorCode> {
		if (ADMIN_PATHS.none { path.startsWith("$it/") }) {
			return COMMON_ERRORS
		}
		return COMMON_ERRORS + ADMIN_ERRORS + if (method in CSRF_PROTECTED_METHODS) CSRF_ERRORS else emptyList()
	}

	private fun errorSchema(components: Components, specVersion: SpecVersion): Schema<*> {
		val error = SpringDocAnnotationsUtils.extractSchema(components, ErrorResponse::class.java, null, null, specVersion)
		return ModelConverters.getInstance(specVersion == SpecVersion.V31)
			.resolveAsResolvedSchema(AnnotatedType(ApiResponse::class.java))
			.schema
			.addProperty(ApiResponse<*>::data.name, Schema<Any>().typesItem(NULL_TYPE))
			.addProperty(ApiResponse<*>::error.name, error)
	}

	private fun errorResponse(status: HttpStatus, errorCodes: List<ErrorCode>): OpenApiResponse {
		val mediaType = MediaType().schema(Schema<Any>().`$ref`(ERROR_SCHEMA_NAME))
		if (errorCodes.size == 1) {
			mediaType.example(example(errorCodes.single()))
		} else {
			errorCodes.forEach { mediaType.addExamples(it.code, Example().value(example(it))) }
		}
		return OpenApiResponse()
			.description(status.reasonPhrase)
			.content(Content().addMediaType(springDocConfigProperties.defaultProducesMediaType, mediaType))
	}

	private fun example(errorCode: ErrorCode): Map<*, *> =
		jsonMapper.convertValue(errorResponseFactory.create(errorCode), Map::class.java)

	companion object {
		private const val ERROR_SCHEMA_NAME = "ErrorApiResponse"
		private const val NULL_TYPE = "null"
		private val COMMON_ERRORS = listOf(CommonErrorCode.INVALID_INPUT, CommonErrorCode.INTERNAL_SERVER_ERROR)
		private val ADMIN_PATHS = listOf(ApiPaths.APP_ADMIN, ApiPaths.HOTEL_ADMIN)
		private val ADMIN_ERRORS = listOf(CommonErrorCode.UNAUTHORIZED, CommonErrorCode.FORBIDDEN)
		private val CSRF_ERRORS = listOf(CommonErrorCode.INVALID_CSRF_TOKEN)
		private val CSRF_PROTECTED_METHODS = setOf(PathItem.HttpMethod.POST, PathItem.HttpMethod.PUT, PathItem.HttpMethod.PATCH, PathItem.HttpMethod.DELETE)
	}
}
