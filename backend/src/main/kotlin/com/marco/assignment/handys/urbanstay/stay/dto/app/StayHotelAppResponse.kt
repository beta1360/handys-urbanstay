package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import io.swagger.v3.oas.annotations.media.Schema

data class StayHotelAppResponse(
	@Schema(description = "openapi.schema.StayHotelAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.StayHotelAppResponse.name", example = "어반스테이 강남")
	val name: String,
) {

	companion object {

		fun from(hotel: Hotel): StayHotelAppResponse = StayHotelAppResponse(checkNotNull(hotel.id), hotel.name)
	}
}
