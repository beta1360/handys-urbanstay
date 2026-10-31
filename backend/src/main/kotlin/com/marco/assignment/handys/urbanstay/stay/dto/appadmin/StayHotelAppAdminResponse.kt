package com.marco.assignment.handys.urbanstay.stay.dto.appadmin

import io.swagger.v3.oas.annotations.media.Schema

data class StayHotelAppAdminResponse(
	@Schema(description = "openapi.schema.StayHotelAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayHotelAppAdminResponse.name", example = "어반스테이 강남")
	val name: String,
)
