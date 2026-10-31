package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

data class RoomCurrentStayHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomCurrentStayHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomCurrentStayHotelAdminResponse.checkInDate", example = "2026-11-01")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.RoomCurrentStayHotelAdminResponse.checkOutDate", example = "2026-11-03")
	val checkOutDate: LocalDate,
	@Schema(description = "openapi.schema.RoomCurrentStayHotelAdminResponse.guest")
	val guest: RoomCurrentStayGuestHotelAdminResponse,
) {

	companion object {

		fun from(stay: Stay): RoomCurrentStayHotelAdminResponse =
			RoomCurrentStayHotelAdminResponse(
				id = checkNotNull(stay.id),
				checkInDate = stay.checkInDate,
				checkOutDate = stay.checkOutDate,
				guest = RoomCurrentStayGuestHotelAdminResponse.from(stay.guest),
			)
	}
}
