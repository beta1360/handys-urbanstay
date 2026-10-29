package com.marco.assignment.handys.urbanstay.account.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import io.swagger.v3.oas.annotations.media.Schema

data class AccountHotelHotelAdminResponse(
	@Schema(description = "openapi.schema.AccountHotelHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.AccountHotelHotelAdminResponse.name", example = "어반스테이 강남")
	val name: String,
) {

	companion object {

		fun from(hotel: Hotel): AccountHotelHotelAdminResponse = AccountHotelHotelAdminResponse(checkNotNull(hotel.id), hotel.name)
	}
}
