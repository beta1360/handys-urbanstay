package com.marco.assignment.handys.urbanstay.common.exception

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.security.web.csrf.CsrfException
import org.springframework.stereotype.Component
import tools.jackson.databind.json.JsonMapper

@Component
class SecurityErrorHandler(
	private val errorResponseFactory: ErrorResponseFactory,
	private val jsonMapper: JsonMapper,
) : AuthenticationEntryPoint, AccessDeniedHandler {

	override fun commence(request: HttpServletRequest, response: HttpServletResponse, authException: AuthenticationException) =
		respond(response, CommonErrorCode.UNAUTHORIZED)

	override fun handle(request: HttpServletRequest, response: HttpServletResponse, accessDeniedException: AccessDeniedException) =
		respond(response, if (accessDeniedException is CsrfException) CommonErrorCode.INVALID_CSRF_TOKEN else CommonErrorCode.FORBIDDEN)

	private fun respond(response: HttpServletResponse, errorCode: ErrorCode) {
		response.status = errorCode.status.value()
		response.contentType = MediaType.APPLICATION_JSON_VALUE
		jsonMapper.writeValue(response.outputStream, errorResponseFactory.create(errorCode))
	}
}
