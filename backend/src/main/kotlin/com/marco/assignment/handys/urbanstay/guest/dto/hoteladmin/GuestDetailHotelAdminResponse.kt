package com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema

data class GuestDetailHotelAdminResponse(
	@Schema(description = "openapi.schema.GuestDetailHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.GuestDetailHotelAdminResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.GuestDetailHotelAdminResponse.phone", example = "010-1234-5678")
	val phone: String,
	@Schema(description = "openapi.schema.GuestDetailHotelAdminResponse.email", example = "guest@example.com")
	val email: String,
	@Schema(description = "openapi.schema.GuestDetailHotelAdminResponse.currentStay")
	val currentStay: GuestCurrentStayHotelAdminResponse?,
	@Schema(description = "openapi.schema.GuestDetailHotelAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(guest: Guest, currentStay: Stay?): GuestDetailHotelAdminResponse =
			GuestDetailHotelAdminResponse(
				id = checkNotNull(guest.id),
				name = guest.name,
				phone = guest.phone,
				email = guest.email,
				currentStay = currentStay?.let(GuestCurrentStayHotelAdminResponse::from),
				version = guest.version,
			)
	}
}
