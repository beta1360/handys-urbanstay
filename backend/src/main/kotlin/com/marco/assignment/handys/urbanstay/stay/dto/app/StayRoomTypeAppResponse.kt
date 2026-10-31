package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.stay.service.RoomTypeAvailability
import io.swagger.v3.oas.annotations.media.Schema

data class StayRoomTypeAppResponse(
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.type", example = "스탠다드")
	val type: String,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.roomCount", example = "3")
	val roomCount: Int,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.maxGuests", example = "4")
	val maxGuests: Int,
	@Schema(description = "openapi.schema.StayRoomTypeAppResponse.availableCount", example = "2")
	val availableCount: Int,
) {

	companion object {

		fun from(availability: RoomTypeAvailability): StayRoomTypeAppResponse =
			StayRoomTypeAppResponse(
				type = availability.type,
				roomCount = availability.roomCount,
				maxGuests = availability.maxGuests,
				availableCount = availability.availableCount,
			)
	}
}
