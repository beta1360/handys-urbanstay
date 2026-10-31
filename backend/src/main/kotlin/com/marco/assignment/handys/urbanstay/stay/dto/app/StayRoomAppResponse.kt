package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.room.entity.Room
import io.swagger.v3.oas.annotations.media.Schema

data class StayRoomAppResponse(
	@Schema(description = "openapi.schema.StayRoomAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayRoomAppResponse.name", example = "101")
	val name: String,
) {

	companion object {

		fun from(room: Room): StayRoomAppResponse = StayRoomAppResponse(checkNotNull(room.id), room.name)
	}
}
