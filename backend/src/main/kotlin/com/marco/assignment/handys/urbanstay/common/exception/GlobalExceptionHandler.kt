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

@RestControllerAdvice
class GlobalExceptionHandler(private val errorResponseFactory: ErrorResponseFactory) {

	private val log = LoggerFactory.getLogger(javaClass)

	@ExceptionHandler(BusinessException::class)
	fun handleBusinessException(e: BusinessException): ResponseEntity<ApiResponse<Nothing>> =
		respond(e.errorCode)

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

	@ExceptionHandler(
		HttpMessageNotReadableException::class,
		MethodArgumentTypeMismatchException::class,
		MissingServletRequestParameterException::class,
		HttpMediaTypeNotSupportedException::class,
	)
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
}
