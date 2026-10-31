package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import io.swagger.v3.oas.annotations.media.Schema

data class StayRoomTypeHotelAdminResponse(
	@Schema(description = "openapi.schema.StayRoomTypeHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayRoomTypeHotelAdminResponse.name", example = "스탠다드")
	val name: String,
)
