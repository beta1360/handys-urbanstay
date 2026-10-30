package com.marco.assignment.handys.urbanstay.common.exception

import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.ErrorResponse
import com.marco.assignment.handys.urbanstay.common.response.FieldErrorResponse
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.stereotype.Component

@Component
class ErrorResponseFactory(private val messageSource: MessageSource) {

	fun create(errorCode: ErrorCode, fieldErrors: List<FieldErrorResponse> = emptyList()): ApiResponse<Nothing> =
		ApiResponse.failure(ErrorResponse(errorCode.code, message(errorCode.messageKey), fieldErrors))

	fun fieldError(field: String, messageKey: String, arguments: Map<String, Any> = emptyMap()): FieldErrorResponse =
		FieldErrorResponse(field, arguments.entries.fold(message(messageKey)) { text, (name, value) -> text.replace("{$name}", value.toString()) })

	private fun message(key: String): String = messageSource.getMessage(key, null, LocaleContextHolder.getLocale())
}
