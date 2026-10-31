package com.marco.assignment.handys.urbanstay.common.exception

import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.FieldErrorResponse
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.HandlerMethodValidationException
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.servlet.NoHandlerFoundException
import org.springframework.web.servlet.resource.NoResourceFoundException
import tools.jackson.core.JacksonException
import tools.jackson.core.JsonToken
import tools.jackson.core.exc.InputCoercionException
import tools.jackson.databind.exc.InvalidNullException
import tools.jackson.databind.exc.MismatchedInputException
import tools.jackson.databind.exc.UnrecognizedPropertyException

@RestControllerAdvice
class GlobalExceptionHandler(private val errorResponseFactory: ErrorResponseFactory) {

	private val log = LoggerFactory.getLogger(javaClass)

	@ExceptionHandler(BusinessException::class)
	fun handleBusinessException(e: BusinessException): ResponseEntity<ApiResponse<Nothing>> =
		respond(e.errorCode, e.fieldErrors.map { errorResponseFactory.fieldError(it.field, it.messageKey, it.arguments) })

	@ExceptionHandler(MethodArgumentNotValidException::class)
	fun handleMethodArgumentNotValid(e: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Nothing>> =
		respond(
			CommonErrorCode.INVALID_INPUT,
			e.bindingResult.fieldErrors.map { FieldErrorResponse(it.field, it.defaultMessage.orEmpty()) },
		)

	@ExceptionHandler(HandlerMethodValidationException::class)
	fun handleHandlerMethodValidation(e: HandlerMethodValidationException): ResponseEntity<ApiResponse<Nothing>> =
		respond(
			CommonErrorCode.INVALID_INPUT,
			e.parameterValidationResults.flatMap { result ->
				val name = result.methodParameter.parameterName ?: return@flatMap emptyList()
				result.resolvableErrors.map { FieldErrorResponse(name, it.defaultMessage.orEmpty()) }
			},
		)

	@ExceptionHandler(HttpMessageNotReadableException::class)
	fun handleHttpMessageNotReadable(e: HttpMessageNotReadableException): ResponseEntity<ApiResponse<Nothing>> =
		respond(CommonErrorCode.INVALID_INPUT, listOfNotNull(bodyFieldError(e.cause)))

	@ExceptionHandler(MethodArgumentTypeMismatchException::class)
	fun handleMethodArgumentTypeMismatch(e: MethodArgumentTypeMismatchException): ResponseEntity<ApiResponse<Nothing>> =
		respond(CommonErrorCode.INVALID_INPUT, listOf(errorResponseFactory.fieldError(e.name, TYPE_MESSAGE_KEY)))

	@ExceptionHandler(MissingServletRequestParameterException::class)
	fun handleMissingServletRequestParameter(e: MissingServletRequestParameterException): ResponseEntity<ApiResponse<Nothing>> =
		respond(CommonErrorCode.INVALID_INPUT, listOf(errorResponseFactory.fieldError(e.parameterName, REQUIRED_MESSAGE_KEY)))

	@ExceptionHandler(HttpMediaTypeNotSupportedException::class)
	fun handleInvalidRequest(): ResponseEntity<ApiResponse<Nothing>> =
		respond(CommonErrorCode.INVALID_INPUT)

	@ExceptionHandler(
		NoResourceFoundException::class,
		NoHandlerFoundException::class,
		HttpRequestMethodNotSupportedException::class,
	)
	fun handleNotFound(): ResponseEntity<ApiResponse<Nothing>> =
		respond(CommonErrorCode.NOT_FOUND)

	@ExceptionHandler(AccessDeniedException::class, AuthenticationException::class)
	fun rethrowSecurityException(e: Exception): Nothing = throw e

	@ExceptionHandler(Exception::class)
	fun handleUnexpected(e: Exception): ResponseEntity<ApiResponse<Nothing>> {
		log.error("Unhandled exception", e)
		return respond(CommonErrorCode.INTERNAL_SERVER_ERROR)
	}

	private fun respond(
		errorCode: ErrorCode,
		fieldErrors: List<FieldErrorResponse> = emptyList(),
	): ResponseEntity<ApiResponse<Nothing>> =
		ResponseEntity.status(errorCode.status).body(errorResponseFactory.create(errorCode, fieldErrors))

	private fun bodyFieldError(cause: Throwable?): FieldErrorResponse? {
		if (cause !is MismatchedInputException && cause !is InputCoercionException) {
			return null
		}
		val field = fieldPath(cause.path).ifEmpty { return null }
		val messageKey = when {
			cause is UnrecognizedPropertyException -> UNKNOWN_FIELD_MESSAGE_KEY
			cause is InvalidNullException -> REQUIRED_MESSAGE_KEY
			cause is MismatchedInputException && cause.currentToken in MISSING_OR_NULL_TOKENS -> REQUIRED_MESSAGE_KEY
			else -> TYPE_MESSAGE_KEY
		}
		return errorResponseFactory.fieldError(field, messageKey)
	}

	private fun fieldPath(path: List<JacksonException.Reference>): String =
		path.joinToString("") { if (it.index >= 0) "[${it.index}]" else ".${it.propertyName}" }.removePrefix(".")

	companion object {
		private const val REQUIRED_MESSAGE_KEY = "validation.required"
		private const val TYPE_MESSAGE_KEY = "validation.type"
		private const val UNKNOWN_FIELD_MESSAGE_KEY = "validation.unknown-field"

		// Kotlin 원시 타입(Int, Boolean 등)의 누락·null은 Jackson이 하위 예외 없이 MismatchedInputException으로 던진다.
		// 누락은 객체를 다 읽은 뒤(END_OBJECT), null은 그 값(VALUE_NULL)에서 나므로 토큰으로 필수 입력을 구분한다.
		private val MISSING_OR_NULL_TOKENS = setOf(JsonToken.END_OBJECT, JsonToken.VALUE_NULL)
	}
}
