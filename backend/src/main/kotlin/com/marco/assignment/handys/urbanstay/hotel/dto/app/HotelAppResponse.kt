package com.marco.assignment.handys.urbanstay.hotel.dto.app

import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRoomCount
import io.swagger.v3.oas.annotations.media.Schema

data class HotelAppResponse(
	@Schema(description = "openapi.schema.HotelAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.HotelAppResponse.name", example = "어반스테이 강남")
	val name: String,
	@Schema(description = "openapi.schema.HotelAppResponse.address", example = "서울특별시 강남구 테헤란로 123")
	val address: String,
	@Schema(description = "openapi.schema.HotelAppResponse.roomCount", example = "12")
	val roomCount: Int,
) {

	companion object {

		fun from(hotelRoomCount: HotelRoomCount): HotelAppResponse {
			val hotel = hotelRoomCount.hotel
			return HotelAppResponse(checkNotNull(hotel.id), hotel.name, hotel.address, Math.toIntExact(hotelRoomCount.roomCount))
		}
	}
}
