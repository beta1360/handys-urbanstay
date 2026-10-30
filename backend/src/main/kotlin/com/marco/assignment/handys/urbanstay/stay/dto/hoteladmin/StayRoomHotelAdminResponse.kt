package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.room.entity.Room
import io.swagger.v3.oas.annotations.media.Schema

data class StayRoomHotelAdminResponse(
	@Schema(description = "openapi.schema.StayRoomHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayRoomHotelAdminResponse.name", example = "101")
	val name: String,
) {

	companion object {

		fun from(room: Room): StayRoomHotelAdminResponse = StayRoomHotelAdminResponse(checkNotNull(room.id), room.name)
	}
}
