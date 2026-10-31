package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant
import java.time.LocalDate

data class StaySettlementStayHotelAdminResponse(
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.room")
	val room: StayRoomHotelAdminResponse,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.roomType")
	val roomType: StayRoomTypeHotelAdminResponse,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.guest")
	val guest: StaySettlementGuestHotelAdminResponse,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.nights", example = "2")
	val nights: Int,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.totalAmount", example = "200000")
	val totalAmount: Int,
	@Schema(description = "openapi.schema.StaySettlementStayHotelAdminResponse.canceledAt", example = "2026-10-30T06:59:32.123456Z")
	val canceledAt: Instant?,
) {

	companion object {

		fun from(stay: Stay): StaySettlementStayHotelAdminResponse =
			StaySettlementStayHotelAdminResponse(
				id = checkNotNull(stay.id),
				room = StayRoomHotelAdminResponse.from(stay.room),
				roomType = StayRoomTypeHotelAdminResponse(checkNotNull(stay.room.roomType.id), stay.room.roomType.name),
				guest = StaySettlementGuestHotelAdminResponse(checkNotNull(stay.guest.id), stay.guest.name),
				checkInDate = stay.checkInDate,
				checkOutDate = stay.checkOutDate,
				nights = stay.nights,
				totalAmount = stay.totalAmount,
				canceledAt = stay.canceledAt,
			)
	}
}
