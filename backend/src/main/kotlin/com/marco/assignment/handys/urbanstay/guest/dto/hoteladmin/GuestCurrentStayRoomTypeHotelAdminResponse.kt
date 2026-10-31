package com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import io.swagger.v3.oas.annotations.media.Schema

data class GuestCurrentStayRoomTypeHotelAdminResponse(
	@Schema(description = "openapi.schema.GuestCurrentStayRoomTypeHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.GuestCurrentStayRoomTypeHotelAdminResponse.name", example = "스탠다드")
	val name: String,
) {

	companion object {

		fun from(roomType: RoomType): GuestCurrentStayRoomTypeHotelAdminResponse =
			GuestCurrentStayRoomTypeHotelAdminResponse(checkNotNull(roomType.id), roomType.name)
	}
}
