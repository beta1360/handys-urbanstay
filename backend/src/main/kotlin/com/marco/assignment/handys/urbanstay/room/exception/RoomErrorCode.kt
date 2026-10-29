package com.marco.assignment.handys.urbanstay.room.exception

import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import org.springframework.http.HttpStatus

enum class RoomErrorCode(override val status: HttpStatus) : ErrorCode {
	ROOM_NOT_FOUND(HttpStatus.NOT_FOUND),
	ROOM_DUPLICATED(HttpStatus.CONFLICT),
}
