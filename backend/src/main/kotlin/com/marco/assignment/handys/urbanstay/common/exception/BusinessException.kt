package com.marco.assignment.handys.urbanstay.common.exception

class BusinessException(
	val errorCode: ErrorCode,
	val fieldErrors: List<InvalidField> = emptyList(),
) : RuntimeException(errorCode.code)

data class InvalidField(
	val field: String,
	val messageKey: String,
	val arguments: Map<String, Any> = emptyMap(),
)
