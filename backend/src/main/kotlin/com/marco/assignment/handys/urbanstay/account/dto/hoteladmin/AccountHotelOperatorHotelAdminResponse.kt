package com.marco.assignment.handys.urbanstay.account.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import io.swagger.v3.oas.annotations.media.Schema

data class AccountHotelOperatorHotelAdminResponse(
	@Schema(description = "openapi.schema.AccountHotelOperatorHotelAdminResponse.id", example = "2")
	val id: Long,
	@Schema(description = "openapi.schema.AccountHotelOperatorHotelAdminResponse.loginId", example = "operator@example.com")
	val loginId: String,
	@Schema(description = "openapi.schema.AccountHotelOperatorHotelAdminResponse.name", example = "김운영")
	val name: String,
	@Schema(description = "openapi.schema.AccountHotelOperatorHotelAdminResponse.active", example = "true")
	val active: Boolean,
	@Schema(description = "openapi.schema.AccountHotelOperatorHotelAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(operator: HotelAdmin): AccountHotelOperatorHotelAdminResponse =
			AccountHotelOperatorHotelAdminResponse(checkNotNull(operator.id), operator.loginId, operator.name, operator.active, operator.version)
	}
}
