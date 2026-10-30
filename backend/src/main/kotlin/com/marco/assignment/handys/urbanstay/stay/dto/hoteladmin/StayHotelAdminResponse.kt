package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

data class StayHotelAdminResponse(
	@Schema(description = "openapi.schema.StayHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.room")
	val room: StayRoomHotelAdminResponse,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.guest")
	val guest: StayGuestHotelAdminResponse,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.guestCount", example = "2")
	val guestCount: Int,
) {

	companion object {

		fun from(stay: Stay): StayHotelAdminResponse =
			StayHotelAdminResponse(
				id = checkNotNull(stay.id),
				room = StayRoomHotelAdminResponse.from(stay.room),
				guest = StayGuestHotelAdminResponse.from(stay.guest),
				checkInDate = stay.checkInDate,
				checkOutDate = stay.checkOutDate,
				guestCount = stay.guestCount,
			)
	}
}
