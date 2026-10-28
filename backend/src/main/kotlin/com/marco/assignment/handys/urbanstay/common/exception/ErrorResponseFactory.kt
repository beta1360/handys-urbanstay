package com.marco.assignment.handys.urbanstay.common.exception

import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.ErrorResponse
import com.marco.assignment.handys.urbanstay.common.response.FieldErrorResponse
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.stereotype.Component

@Component
class ErrorResponseFactory(private val messageSource: MessageSource) {

	fun create(errorCode: ErrorCode, fieldErrors: List<FieldErrorResponse> = emptyList()): ApiResponse<Nothing> {
		val message = messageSource.getMessage(errorCode.messageKey, null, LocaleContextHolder.getLocale())
		return ApiResponse.failure(ErrorResponse(errorCode.code, message, fieldErrors))
	}
}
