package com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.room.entity.Room
import io.swagger.v3.oas.annotations.media.Schema

data class GuestCurrentStayRoomHotelAdminResponse(
	@Schema(description = "openapi.schema.GuestCurrentStayRoomHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.GuestCurrentStayRoomHotelAdminResponse.name", example = "101")
	val name: String,
	@Schema(description = "openapi.schema.GuestCurrentStayRoomHotelAdminResponse.roomType")
	val roomType: GuestCurrentStayRoomTypeHotelAdminResponse,
) {

	companion object {

		fun from(room: Room): GuestCurrentStayRoomHotelAdminResponse =
			GuestCurrentStayRoomHotelAdminResponse(checkNotNull(room.id), room.name, GuestCurrentStayRoomTypeHotelAdminResponse.from(room.roomType))
	}
}
