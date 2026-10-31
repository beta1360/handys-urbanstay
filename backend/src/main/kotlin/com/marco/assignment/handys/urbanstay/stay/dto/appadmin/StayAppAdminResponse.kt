package com.marco.assignment.handys.urbanstay.stay.dto.appadmin

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant
import java.time.LocalDate

data class StayAppAdminResponse(
	@Schema(description = "openapi.schema.StayAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayAppAdminResponse.hotel")
	val hotel: StayHotelAppAdminResponse,
	@Schema(description = "openapi.schema.StayAppAdminResponse.room")
	val room: StayRoomAppAdminResponse,
	@Schema(description = "openapi.schema.StayAppAdminResponse.roomType")
	val roomType: StayRoomTypeAppAdminResponse,
	@Schema(description = "openapi.schema.StayAppAdminResponse.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayAppAdminResponse.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Schema(description = "openapi.schema.StayAppAdminResponse.guestCount", example = "2")
	val guestCount: Int,
	@Schema(description = "openapi.schema.StayAppAdminResponse.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.StayAppAdminResponse.nights", example = "2")
	val nights: Int,
	@Schema(description = "openapi.schema.StayAppAdminResponse.baseAmount", example = "200000")
	val baseAmount: Int,
	@Schema(description = "openapi.schema.StayAppAdminResponse.discountAmount", example = "0")
	val discountAmount: Int,
	@Schema(description = "openapi.schema.StayAppAdminResponse.totalAmount", example = "200000")
	val totalAmount: Int,
	@Schema(description = "openapi.schema.StayAppAdminResponse.canceledAt", example = "2026-10-30T06:59:32.123456Z")
	val canceledAt: Instant?,
) {

	companion object {

		fun from(stay: Stay): StayAppAdminResponse =
			StayAppAdminResponse(
				id = checkNotNull(stay.id),
				hotel = StayHotelAppAdminResponse(checkNotNull(stay.room.hotel.id), stay.room.hotel.name),
				room = StayRoomAppAdminResponse(checkNotNull(stay.room.id), stay.room.name),
				roomType = StayRoomTypeAppAdminResponse(checkNotNull(stay.room.roomType.id), stay.room.roomType.name),
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
