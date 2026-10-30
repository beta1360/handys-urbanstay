package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import io.swagger.v3.oas.annotations.media.Schema

data class RoomStatusUpdateHotelAdminRequest(
	@Schema(description = "openapi.schema.RoomStatusUpdateHotelAdminRequest.from", example = "VACANT")
	val from: RoomStatus,
	@Schema(description = "openapi.schema.RoomStatusUpdateHotelAdminRequest.to", example = "RESERVED")
	val to: RoomStatus,
)
