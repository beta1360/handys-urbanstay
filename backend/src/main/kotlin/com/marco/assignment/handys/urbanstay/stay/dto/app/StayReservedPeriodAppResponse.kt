package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

data class StayReservedPeriodAppResponse(
	@Schema(description = "openapi.schema.StayReservedPeriodAppResponse.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayReservedPeriodAppResponse.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
) {

	companion object {

		fun from(stay: Stay): StayReservedPeriodAppResponse = StayReservedPeriodAppResponse(stay.checkInDate, stay.checkOutDate)
	}
}
