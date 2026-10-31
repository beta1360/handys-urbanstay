package com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

data class GuestCurrentStayHotelAdminResponse(
	@Schema(description = "openapi.schema.GuestCurrentStayHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.GuestCurrentStayHotelAdminResponse.room")
	val room: GuestCurrentStayRoomHotelAdminResponse,
	@Schema(description = "openapi.schema.GuestCurrentStayHotelAdminResponse.checkInDate", example = "2026-11-01")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.GuestCurrentStayHotelAdminResponse.checkOutDate", example = "2026-11-03")
	val checkOutDate: LocalDate,
) {

	companion object {

		fun from(stay: Stay): GuestCurrentStayHotelAdminResponse =
			GuestCurrentStayHotelAdminResponse(
				id = checkNotNull(stay.id),
				room = GuestCurrentStayRoomHotelAdminResponse.from(stay.room),
				checkInDate = stay.checkInDate,
				checkOutDate = stay.checkOutDate,
			)
	}
}
