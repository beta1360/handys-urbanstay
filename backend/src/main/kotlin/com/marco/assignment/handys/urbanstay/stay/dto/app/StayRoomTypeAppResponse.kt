package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.stay.service.RoomTypeAvailability
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalTime

data class StayRoomTypeAppResponse(
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.name", example = "스탠다드")
	val name: String,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.capacity", example = "4")
	val capacity: Int,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.checkInTime", example = "15:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkInTime: LocalTime,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.checkOutTime", example = "11:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkOutTime: LocalTime,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.roomCount", example = "3")
	val roomCount: Int,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.availableCount", example = "2")
	val availableCount: Int,
) {

	companion object {

		fun from(availability: RoomTypeAvailability): StayRoomTypeAppResponse {
			val roomType = availability.roomType
			return StayRoomTypeAppResponse(
				id = checkNotNull(roomType.id),
				name = roomType.name,
				capacity = roomType.capacity,
				roomRate = roomType.roomRate,
				checkInTime = roomType.checkInTime,
				checkOutTime = roomType.checkOutTime,
				roomCount = availability.roomCount,
				availableCount = availability.availableCount,
			)
		}
	}
}
