package com.marco.assignment.handys.urbanstay.account.exception

import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import org.springframework.http.HttpStatus

enum class AccountErrorCode(override val status: HttpStatus) : ErrorCode {
	INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
	LOGIN_ID_DUPLICATED(HttpStatus.CONFLICT),
	HOTEL_MASTER_NOT_FOUND(HttpStatus.NOT_FOUND),
	HOTEL_ADMIN_MODIFIED(HttpStatus.CONFLICT),
	HOTEL_OPERATOR_NOT_FOUND(HttpStatus.NOT_FOUND),
}
