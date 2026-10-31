package com.marco.assignment.handys.urbanstay.room.dto.app

import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.room.entity.Room
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalTime

data class RoomAppResponse(
	@Schema(description = "openapi.schema.RoomAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomAppResponse.name", example = "101")
	val name: String,
	@Schema(description = "openapi.schema.RoomAppResponse.type", example = "스탠다드")
	val type: String,
	@Schema(description = "openapi.schema.RoomAppResponse.capacity", example = "2")
	val capacity: Int,
	@Schema(description = "openapi.schema.RoomAppResponse.checkInTime", example = "15:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkInTime: LocalTime,
	@Schema(description = "openapi.schema.RoomAppResponse.checkOutTime", example = "11:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkOutTime: LocalTime,
) {

	companion object {

		fun from(room: Room): RoomAppResponse =
			RoomAppResponse(
				id = checkNotNull(room.id),
				name = room.name,
				type = room.type,
				capacity = room.capacity,
				checkInTime = room.checkInTime,
				checkOutTime = room.checkOutTime,
			)
	}
}
