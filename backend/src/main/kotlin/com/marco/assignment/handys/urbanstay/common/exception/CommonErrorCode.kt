package com.marco.assignment.handys.urbanstay.common.exception

import org.springframework.http.HttpStatus

enum class CommonErrorCode(override val status: HttpStatus) : ErrorCode {
	INVALID_INPUT(HttpStatus.BAD_REQUEST),
	NOT_FOUND(HttpStatus.NOT_FOUND),
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR),
}
