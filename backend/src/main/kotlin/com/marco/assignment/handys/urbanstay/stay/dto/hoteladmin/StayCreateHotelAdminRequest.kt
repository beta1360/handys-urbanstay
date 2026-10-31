package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Min
import java.time.LocalDate

data class StayCreateHotelAdminRequest(
	@Schema(description = "openapi.schema.StayCreateHotelAdminRequest.roomId", example = "1")
	val roomId: Long,
	@Schema(description = "openapi.schema.StayCreateHotelAdminRequest.guestId", example = "1")
	val guestId: Long,
	@Schema(description = "openapi.schema.StayCreateHotelAdminRequest.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayCreateHotelAdminRequest.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Min(value = Stay.MIN_GUEST_COUNT, message = "{validation.min}")
	@Schema(description = "openapi.schema.StayCreateHotelAdminRequest.guestCount", example = "2")
	val guestCount: Int,
)
