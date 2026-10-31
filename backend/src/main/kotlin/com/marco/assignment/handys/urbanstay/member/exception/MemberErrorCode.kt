package com.marco.assignment.handys.urbanstay.member.exception

import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import org.springframework.http.HttpStatus

enum class MemberErrorCode(override val status: HttpStatus) : ErrorCode {
	MEMBER_EMAIL_DUPLICATED(HttpStatus.CONFLICT),
	MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND),
}
