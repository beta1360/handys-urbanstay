package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import java.time.LocalDate

data class StayCreateAppRequest(
	@Schema(description = "openapi.schema.StayCreateAppRequest.hotelId", example = "1")
	val hotelId: Long,
	@Schema(description = "openapi.schema.StayCreateAppRequest.roomTypeId", example = "1")
	val roomTypeId: Long,
	@Schema(description = "openapi.schema.StayCreateAppRequest.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayCreateAppRequest.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Min(value = Stay.MIN_GUEST_COUNT, message = "{validation.min}")
	@Schema(description = "openapi.schema.StayCreateAppRequest.guestCount", example = "2")
	val guestCount: Int,
	@Valid
	@Schema(description = "openapi.schema.StayCreateAppRequest.guest")
	val guest: StayGuestCreateAppRequest,
)
