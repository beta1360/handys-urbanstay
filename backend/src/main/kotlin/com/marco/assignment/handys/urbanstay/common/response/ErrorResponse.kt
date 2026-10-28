package com.marco.assignment.handys.urbanstay.common.response

data class ErrorResponse(
	val code: String,
	val message: String,
	val fieldErrors: List<FieldErrorResponse> = emptyList(),
)
