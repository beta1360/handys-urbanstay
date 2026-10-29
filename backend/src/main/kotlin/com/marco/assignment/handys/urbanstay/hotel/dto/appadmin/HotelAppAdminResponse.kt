package com.marco.assignment.handys.urbanstay.hotel.dto.appadmin

import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import io.swagger.v3.oas.annotations.media.Schema

data class HotelAppAdminResponse(
	@Schema(description = "openapi.schema.HotelAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.HotelAppAdminResponse.name", example = "어반스테이 강남")
	val name: String,
	@Schema(description = "openapi.schema.HotelAppAdminResponse.address", example = "서울특별시 강남구 테헤란로 123")
	val address: String,
	@Schema(description = "openapi.schema.HotelAppAdminResponse.phone", example = "02-1234-5678")
	val phone: String,
	@Schema(description = "openapi.schema.HotelAppAdminResponse.description", example = "강남역에서 걸어서 5분 거리의 비즈니스 호텔입니다.")
	val description: String?,
	@Schema(description = "openapi.schema.HotelAppAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(hotel: Hotel): HotelAppAdminResponse =
			HotelAppAdminResponse(checkNotNull(hotel.id), hotel.name, hotel.address, hotel.phone, hotel.description, hotel.version)
	}
}
