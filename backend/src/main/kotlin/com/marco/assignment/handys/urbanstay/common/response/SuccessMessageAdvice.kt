package com.marco.assignment.handys.urbanstay.common.response

import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.core.MethodParameter
import org.springframework.http.MediaType
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice

@RestControllerAdvice
class SuccessMessageAdvice(private val messageSource: MessageSource) : ResponseBodyAdvice<Any> {

	override fun supports(returnType: MethodParameter, converterType: Class<out HttpMessageConverter<*>>): Boolean =
		returnType.hasMethodAnnotation(SuccessMessage::class.java)

	override fun beforeBodyWrite(
		body: Any?,
		returnType: MethodParameter,
		selectedContentType: MediaType,
		selectedConverterType: Class<out HttpMessageConverter<*>>,
		request: ServerHttpRequest,
		response: ServerHttpResponse,
	): Any? {
		if (body !is ApiResponse<*>) {
			return body
		}
		val key = checkNotNull(returnType.getMethodAnnotation(SuccessMessage::class.java)).key
		return body.copy(message = messageSource.getMessage(key, null, LocaleContextHolder.getLocale()))
	}
}
