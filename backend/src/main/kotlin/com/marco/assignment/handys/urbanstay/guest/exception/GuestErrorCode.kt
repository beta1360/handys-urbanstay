package com.marco.assignment.handys.urbanstay.guest.exception

import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import org.springframework.http.HttpStatus

enum class GuestErrorCode(override val status: HttpStatus) : ErrorCode {
	GUEST_NOT_FOUND(HttpStatus.NOT_FOUND),
	GUEST_PHONE_DUPLICATED(HttpStatus.CONFLICT),
	GUEST_MODIFIED(HttpStatus.CONFLICT),
	GUEST_LINKED_TO_OTHER_MEMBER(HttpStatus.CONFLICT),
}
