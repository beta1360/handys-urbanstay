package com.marco.assignment.handys.urbanstay.account.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import io.swagger.v3.oas.annotations.media.Schema

data class AccountHotelAdminResponse(
	@Schema(description = "openapi.schema.AccountHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.AccountHotelAdminResponse.loginId", example = "master@example.com")
	val loginId: String,
	@Schema(description = "openapi.schema.AccountHotelAdminResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.AccountHotelAdminResponse.role", example = "MASTER")
	val role: HotelAdminRole,
	@Schema(description = "openapi.schema.AccountHotelAdminResponse.hotel")
	val hotel: AccountHotelHotelAdminResponse,
) {

	companion object {

		fun from(hotelAdmin: HotelAdmin): AccountHotelAdminResponse =
			AccountHotelAdminResponse(
				checkNotNull(hotelAdmin.id),
				hotelAdmin.loginId,
				hotelAdmin.name,
				hotelAdmin.role,
				AccountHotelHotelAdminResponse.from(hotelAdmin.hotel),
			)
	}
}
