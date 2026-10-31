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
import io.swagger.v3.oas.models.Operation
import io.swagger.v3.oas.models.PathItem
import io.swagger.v3.oas.models.SpecVersion
import io.swagger.v3.oas.models.examples.Example
import io.swagger.v3.oas.models.media.Content
import io.swagger.v3.oas.models.media.MediaType
import io.swagger.v3.oas.models.media.Schema
import org.springdoc.core.customizers.GlobalOpenApiCustomizer
import org.springdoc.core.customizers.GlobalOperationCustomizer
import org.springdoc.core.properties.SpringDocConfigProperties
import org.springdoc.core.utils.SpringDocAnnotationsUtils
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.method.HandlerMethod
import tools.jackson.databind.json.JsonMapper
import java.lang.reflect.Method
import io.swagger.v3.oas.models.responses.ApiResponse as OpenApiResponse

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CommonErrorResponseCustomizer(
	private val errorResponseFactory: ErrorResponseFactory,
	private val jsonMapper: JsonMapper,
	private val springDocConfigProperties: SpringDocConfigProperties,
) : GlobalOpenApiCustomizer, GlobalOperationCustomizer {

	// operation 단계에서는 컨트롤러 메서드(어노테이션)를, 문서 단계에서는 경로를 알 수 있어
	// 선언한 에러를 임시 필드로 넘긴 뒤 합친다.
	override fun customize(operation: Operation, handlerMethod: HandlerMethod): Operation {
		val declared = handlerMethod.method.annotations
			.filter { it.annotationClass.java.isAnnotationPresent(ApiErrors::class.java) }
			.flatMap(::errorCodes)
		if (declared.isNotEmpty()) {
			operation.addExtension(DECLARED_ERRORS_EXTENSION, DeclaredErrorCodes(declared))
		}
		return operation
	}

	override fun customise(openApi: OpenAPI) {
		val components = openApi.components ?: Components().also { openApi.components = it }
		components.addSchemas(ERROR_SCHEMA_NAME, errorSchema(components, openApi.specVersion))
		openApi.paths.orEmpty().forEach { (path, pathItem) ->
			pathItem.readOperationsMap().forEach { (method, operation) ->
				(errorCodes(path, method) + declaredErrorCodes(operation)).groupBy { it.status }.forEach { (status, codes) ->
					operation.responses.putIfAbsent(status.value().toString(), errorResponse(status, codes))
				}
			}
		}
	}

	private fun errorCodes(path: String, method: PathItem.HttpMethod): List<ErrorCode> {
		if (ADMIN_PATHS.none { path.startsWith("$it/") }) {
			return if (SecurityConfig.isMemberApi(method.name, path)) COMMON_ERRORS + MEMBER_ERRORS else COMMON_ERRORS
		}
		val authErrors = if (SecurityConfig.isPublicAdminApi(method.name, path)) emptyList() else ADMIN_ERRORS
		return COMMON_ERRORS + authErrors + if (method in CSRF_PROTECTED_METHODS) CSRF_ERRORS else emptyList()
	}

	private fun declaredErrorCodes(operation: Operation): List<ErrorCode> {
		val declared = operation.extensions?.remove(DECLARED_ERRORS_EXTENSION) as DeclaredErrorCodes?
		if (operation.extensions?.isEmpty() == true) {
			operation.extensions = null
		}
		return declared?.errorCodes.orEmpty()
	}

	private fun errorCodes(annotation: Annotation): List<ErrorCode> {
		val type = annotation.annotationClass.java
		val value = requireNotNull(type.methods.firstOrNull { it.name == VALUE_ATTRIBUTE && it.returnsErrorCodes() }) {
			"@${type.simpleName} is marked with @${ApiErrors::class.simpleName} but has no `vararg val value: ErrorCode enum` attribute"
		}
		return (value.invoke(annotation) as Array<*>).map { it as ErrorCode }
	}

	private fun Method.returnsErrorCodes(): Boolean =
		parameterCount == 0 && returnType.componentType?.let(ErrorCode::class.java::isAssignableFrom) == true

	private fun errorSchema(components: Components, specVersion: SpecVersion): Schema<*> {
		val error = SpringDocAnnotationsUtils.extractSchema(components, ErrorResponse::class.java, null, null, specVersion)
		return ModelConverters.getInstance(specVersion == SpecVersion.V31)
			.resolveAsResolvedSchema(AnnotatedType(ApiResponse::class.java))
			.schema
			.addProperty(ApiResponse<*>::data.name, Schema<Any>().typesItem(NULL_TYPE))
			.addProperty(ApiResponse<*>::message.name, Schema<Any>().typesItem(NULL_TYPE))
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

	private class DeclaredErrorCodes(val errorCodes: List<ErrorCode>)

	companion object {
		private const val ERROR_SCHEMA_NAME = "ErrorApiResponse"
		private const val NULL_TYPE = "null"
		private const val DECLARED_ERRORS_EXTENSION = "x-urbanstay-declared-error-codes"
		private const val VALUE_ATTRIBUTE = "value"
		private val COMMON_ERRORS = listOf(CommonErrorCode.INVALID_INPUT, CommonErrorCode.INTERNAL_SERVER_ERROR)
		private val ADMIN_PATHS = listOf(ApiPaths.APP_ADMIN, ApiPaths.HOTEL_ADMIN)
		private val ADMIN_ERRORS = listOf(CommonErrorCode.UNAUTHORIZED, CommonErrorCode.FORBIDDEN)
		private val MEMBER_ERRORS = listOf(CommonErrorCode.UNAUTHORIZED)
		private val CSRF_ERRORS = listOf(CommonErrorCode.INVALID_CSRF_TOKEN)
		private val CSRF_PROTECTED_METHODS = setOf(PathItem.HttpMethod.POST, PathItem.HttpMethod.PUT, PathItem.HttpMethod.PATCH, PathItem.HttpMethod.DELETE)
	}
}
