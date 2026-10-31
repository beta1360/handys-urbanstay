package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant
import java.time.LocalDate

data class StayMyAppResponse(
	@Schema(description = "openapi.schema.StayMyAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayMyAppResponse.hotel")
	val hotel: StayHotelAppResponse,
	@Schema(description = "openapi.schema.StayMyAppResponse.roomType")
	val roomType: StayRoomTypeSummaryAppResponse,
	@Schema(description = "openapi.schema.StayMyAppResponse.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayMyAppResponse.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Schema(description = "openapi.schema.StayMyAppResponse.guestCount", example = "2")
	val guestCount: Int,
	@Schema(description = "openapi.schema.StayMyAppResponse.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.StayMyAppResponse.nights", example = "2")
	val nights: Int,
	@Schema(description = "openapi.schema.StayMyAppResponse.baseAmount", example = "200000")
	val baseAmount: Int,
	@Schema(description = "openapi.schema.StayMyAppResponse.discountAmount", example = "0")
	val discountAmount: Int,
	@Schema(description = "openapi.schema.StayMyAppResponse.totalAmount", example = "200000")
	val totalAmount: Int,
	@Schema(description = "openapi.schema.StayMyAppResponse.canceledAt", example = "2026-10-30T06:59:32.123456Z")
	val canceledAt: Instant?,
) {

	companion object {

		fun from(stay: Stay): StayMyAppResponse =
			StayMyAppResponse(
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
				canceledAt = stay.canceledAt,
			)
	}
}
