package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import io.swagger.v3.oas.annotations.media.Schema

data class StayRoomTypeSummaryAppResponse(
	@Schema(description = "openapi.schema.StayRoomTypeSummaryAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayRoomTypeSummaryAppResponse.name", example = "스탠다드")
	val name: String,
) {

	companion object {

		fun from(roomType: RoomType): StayRoomTypeSummaryAppResponse = StayRoomTypeSummaryAppResponse(checkNotNull(roomType.id), roomType.name)
	}
}
