package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import io.swagger.v3.oas.annotations.media.Schema

data class RoomCurrentStayGuestHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomCurrentStayGuestHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomCurrentStayGuestHotelAdminResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.RoomCurrentStayGuestHotelAdminResponse.phone", example = "010-1234-5678")
	val phone: String,
) {

	companion object {

		fun from(guest: Guest): RoomCurrentStayGuestHotelAdminResponse = RoomCurrentStayGuestHotelAdminResponse(checkNotNull(guest.id), guest.name, guest.phone)
	}
}
