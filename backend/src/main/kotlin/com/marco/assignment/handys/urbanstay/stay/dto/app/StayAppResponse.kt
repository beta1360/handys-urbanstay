package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

data class StayAppResponse(
	@Schema(description = "openapi.schema.StayAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayAppResponse.hotel")
	val hotel: StayHotelAppResponse,
	@Schema(description = "openapi.schema.StayAppResponse.roomType")
	val roomType: StayRoomTypeSummaryAppResponse,
	@Schema(description = "openapi.schema.StayAppResponse.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayAppResponse.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Schema(description = "openapi.schema.StayAppResponse.guestCount", example = "2")
	val guestCount: Int,
	@Schema(description = "openapi.schema.StayAppResponse.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.StayAppResponse.nights", example = "2")
	val nights: Int,
	@Schema(description = "openapi.schema.StayAppResponse.baseAmount", example = "200000")
	val baseAmount: Int,
	@Schema(description = "openapi.schema.StayAppResponse.discountAmount", example = "0")
	val discountAmount: Int,
	@Schema(description = "openapi.schema.StayAppResponse.totalAmount", example = "200000")
	val totalAmount: Int,
	@Schema(description = "openapi.schema.StayAppResponse.guest")
	val guest: StayGuestAppResponse,
) {

	companion object {

		fun from(stay: Stay): StayAppResponse =
			StayAppResponse(
				id = checkNotNull(stay.id),
				hotel = StayHotelAppResponse.from(stay.room.hotel),
				roomType = StayRoomTypeSummaryAppResponse.from(stay.room.roomType),
				checkInDate = stay.checkInDate,
				checkOutDate = stay.checkOutDate,
				guestCount = stay.guestCount,
				roomRate = stay.roomRate,
				nights = stay.nights,
				baseAmount = stay.baseAmount,
				discountAmount = stay.discountAmount,
				totalAmount = stay.totalAmount,
				guest = StayGuestAppResponse.from(stay.guest),
			)
	}
}
