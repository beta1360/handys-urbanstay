package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.stay.repository.StaySettlementSummary
import io.swagger.v3.oas.annotations.media.Schema
import java.time.YearMonth

data class StaySettlementHotelAdminResponse(
	@Schema(description = "openapi.schema.StaySettlementHotelAdminResponse.month", example = "2026-11", pattern = StaySettlementHotelAdminResponse.MONTH_PATTERN)
	val month: String,
	@Schema(description = "openapi.schema.StaySettlementHotelAdminResponse.totalAmount", example = "1200000")
	val totalAmount: Long,
	@Schema(description = "openapi.schema.StaySettlementHotelAdminResponse.stayCount", example = "8")
	val stayCount: Long,
	@Schema(description = "openapi.schema.StaySettlementHotelAdminResponse.canceledCount", example = "2")
	val canceledCount: Long,
) {

	companion object {
		const val MONTH_PATTERN = "^[0-9]{4}-(0[1-9]|1[0-2])$"

		fun of(month: YearMonth, summary: StaySettlementSummary): StaySettlementHotelAdminResponse =
			StaySettlementHotelAdminResponse(month.toString(), summary.totalAmount, summary.stayCount, summary.canceledCount)
	}
}
