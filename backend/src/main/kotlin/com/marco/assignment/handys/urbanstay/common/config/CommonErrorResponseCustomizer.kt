package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.ErrorResponse
import io.swagger.v3.core.converter.AnnotatedType
import io.swagger.v3.core.converter.ModelConverters
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.SpecVersion
import io.swagger.v3.oas.models.media.Content
import io.swagger.v3.oas.models.media.MediaType
import io.swagger.v3.oas.models.media.Schema
import org.springdoc.core.customizers.GlobalOpenApiCustomizer
import org.springdoc.core.properties.SpringDocConfigProperties
import org.springdoc.core.utils.SpringDocAnnotationsUtils
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import tools.jackson.databind.json.JsonMapper
import io.swagger.v3.oas.models.responses.ApiResponse as OpenApiResponse

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CommonErrorResponseCustomizer(
	private val messageSource: MessageSource,
	private val jsonMapper: JsonMapper,
	private val springDocConfigProperties: SpringDocConfigProperties,
) : GlobalOpenApiCustomizer {

	override fun customise(openApi: OpenAPI) {
		val components = openApi.components ?: Components().also { openApi.components = it }
		components.addSchemas(ERROR_SCHEMA_NAME, errorSchema(components, openApi.specVersion))
		val responses = COMMON_ERRORS.associate { it.status.value().toString() to errorResponse(it) }
		openApi.paths.orEmpty().values
			.flatMap { it.readOperations() }
			.forEach { operation -> responses.forEach { (status, response) -> operation.responses.putIfAbsent(status, response) } }
	}

	private fun errorSchema(components: Components, specVersion: SpecVersion): Schema<*> {
		val error = SpringDocAnnotationsUtils.extractSchema(components, ErrorResponse::class.java, null, null, specVersion)
		return ModelConverters.getInstance(specVersion == SpecVersion.V31)
			.resolveAsResolvedSchema(AnnotatedType(ApiResponse::class.java))
			.schema
			.addProperty(ApiResponse<*>::data.name, Schema<Any>().typesItem(NULL_TYPE))
			.addProperty(ApiResponse<*>::error.name, error)
	}

	private fun errorResponse(errorCode: ErrorCode): OpenApiResponse {
		val mediaType = MediaType().schema(Schema<Any>().`$ref`(ERROR_SCHEMA_NAME)).example(example(errorCode))
		return OpenApiResponse()
			.description(errorCode.status.reasonPhrase)
			.content(Content().addMediaType(springDocConfigProperties.defaultProducesMediaType, mediaType))
	}

	private fun example(errorCode: ErrorCode): Map<*, *> {
		val message = messageSource.getMessage(errorCode.messageKey, null, LocaleContextHolder.getLocale())
		return jsonMapper.convertValue(ApiResponse.failure(ErrorResponse(errorCode.code, message)), Map::class.java)
	}

	companion object {
		private const val ERROR_SCHEMA_NAME = "ErrorApiResponse"
		private const val NULL_TYPE = "null"
		private val COMMON_ERRORS = listOf(CommonErrorCode.INVALID_INPUT, CommonErrorCode.INTERNAL_SERVER_ERROR)
	}
}
