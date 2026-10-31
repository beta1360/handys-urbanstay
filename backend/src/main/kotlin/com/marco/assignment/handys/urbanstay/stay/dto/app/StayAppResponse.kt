package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

data class StayAppResponse(
	@Schema(description = "openapi.schema.StayAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayAppResponse.hotel")
	val hotel: StayHotelAppResponse,
	@Schema(description = "openapi.schema.StayAppResponse.room")
	val room: StayRoomAppResponse,
	@Schema(description = "openapi.schema.StayAppResponse.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayAppResponse.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Schema(description = "openapi.schema.StayAppResponse.guestCount", example = "2")
	val guestCount: Int,
	@Schema(description = "openapi.schema.StayAppResponse.guest")
	val guest: StayGuestAppResponse,
) {

	companion object {

		fun from(stay: Stay): StayAppResponse =
			StayAppResponse(
				id = checkNotNull(stay.id),
				hotel = StayHotelAppResponse.from(stay.room.hotel),
				room = StayRoomAppResponse.from(stay.room),
				checkInDate = stay.checkInDate,
				checkOutDate = stay.checkOutDate,
				guestCount = stay.guestCount,
				guest = StayGuestAppResponse.from(stay.guest),
			)
	}
}
