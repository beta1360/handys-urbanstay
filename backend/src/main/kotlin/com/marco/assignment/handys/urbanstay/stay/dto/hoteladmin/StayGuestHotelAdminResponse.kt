package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import io.swagger.v3.oas.annotations.media.Schema

data class StayGuestHotelAdminResponse(
	@Schema(description = "openapi.schema.StayGuestHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayGuestHotelAdminResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.StayGuestHotelAdminResponse.phone", example = "010-1234-5678")
	val phone: String,
) {

	companion object {

		fun from(guest: Guest): StayGuestHotelAdminResponse = StayGuestHotelAdminResponse(checkNotNull(guest.id), guest.name, guest.phone)
	}
}
