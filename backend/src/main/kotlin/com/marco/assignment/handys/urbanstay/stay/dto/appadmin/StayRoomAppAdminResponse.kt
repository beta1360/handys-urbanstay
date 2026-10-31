package com.marco.assignment.handys.urbanstay.stay.dto.appadmin

import io.swagger.v3.oas.annotations.media.Schema

data class StayRoomAppAdminResponse(
	@Schema(description = "openapi.schema.StayRoomAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayRoomAppAdminResponse.name", example = "101")
	val name: String,
)
