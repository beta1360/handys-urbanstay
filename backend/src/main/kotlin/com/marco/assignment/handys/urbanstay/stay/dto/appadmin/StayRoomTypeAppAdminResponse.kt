package com.marco.assignment.handys.urbanstay.stay.dto.appadmin

import io.swagger.v3.oas.annotations.media.Schema

data class StayRoomTypeAppAdminResponse(
	@Schema(description = "openapi.schema.StayRoomTypeAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayRoomTypeAppAdminResponse.name", example = "스탠다드")
	val name: String,
)
