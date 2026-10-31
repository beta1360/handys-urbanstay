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
	@Schema(description = "openapi.schema.StayHotelAdminResponse.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.nights", example = "2")
	val nights: Int,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.baseAmount", example = "200000")
	val baseAmount: Int,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.discountAmount", example = "0")
	val discountAmount: Int,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.totalAmount", example = "200000")
	val totalAmount: Int,
	@Schema(description = "openapi.schema.StayHotelAdminResponse.cancellation")
	val cancellation: StayCancellationHotelAdminResponse?,
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
				roomRate = stay.roomRate,
				nights = stay.nights,
				baseAmount = stay.baseAmount,
				discountAmount = stay.discountAmount,
				totalAmount = stay.totalAmount,
				cancellation = StayCancellationHotelAdminResponse.from(stay),
			)
	}
}
