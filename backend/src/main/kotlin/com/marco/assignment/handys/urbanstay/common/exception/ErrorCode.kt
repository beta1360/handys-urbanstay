package com.marco.assignment.handys.urbanstay.common.exception

import org.springframework.http.HttpStatus

interface ErrorCode {
	val name: String
	val status: HttpStatus
	val code: String get() = name
	val messageKey: String get() = "error.$code"
}
