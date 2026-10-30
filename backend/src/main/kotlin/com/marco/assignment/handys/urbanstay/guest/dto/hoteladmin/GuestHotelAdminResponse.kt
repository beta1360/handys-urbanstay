package com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import io.swagger.v3.oas.annotations.media.Schema

data class GuestHotelAdminResponse(
	@Schema(description = "openapi.schema.GuestHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.GuestHotelAdminResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.GuestHotelAdminResponse.phone", example = "010-1234-5678")
	val phone: String,
	@Schema(description = "openapi.schema.GuestHotelAdminResponse.email", example = "guest@example.com")
	val email: String,
	@Schema(description = "openapi.schema.GuestHotelAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(guest: Guest): GuestHotelAdminResponse =
			GuestHotelAdminResponse(
				id = checkNotNull(guest.id),
				name = guest.name,
				phone = guest.phone,
				email = guest.email,
				version = guest.version,
			)
	}
}
