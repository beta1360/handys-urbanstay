package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import io.swagger.v3.oas.annotations.media.Schema

data class StaySettlementGuestHotelAdminResponse(
	@Schema(description = "openapi.schema.StaySettlementGuestHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StaySettlementGuestHotelAdminResponse.name", example = "홍길동")
	val name: String,
)
