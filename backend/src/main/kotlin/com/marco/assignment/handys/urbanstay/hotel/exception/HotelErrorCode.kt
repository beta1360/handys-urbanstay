package com.marco.assignment.handys.urbanstay.hotel.exception

import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import org.springframework.http.HttpStatus

enum class HotelErrorCode(override val status: HttpStatus) : ErrorCode {
	HOTEL_NOT_FOUND(HttpStatus.NOT_FOUND),
	HOTEL_DUPLICATED(HttpStatus.CONFLICT),
	HOTEL_MODIFIED(HttpStatus.CONFLICT),
}
