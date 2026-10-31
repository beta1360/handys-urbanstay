package com.marco.assignment.handys.urbanstay.stay.exception

import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import org.springframework.http.HttpStatus

enum class StayErrorCode(override val status: HttpStatus) : ErrorCode {
	STAY_NOT_FOUND(HttpStatus.NOT_FOUND),
	STAY_PERIOD_OVERLAPPED(HttpStatus.CONFLICT),
	STAY_ALREADY_CANCELED(HttpStatus.CONFLICT),
	STAY_ALREADY_ENDED(HttpStatus.CONFLICT),
}
