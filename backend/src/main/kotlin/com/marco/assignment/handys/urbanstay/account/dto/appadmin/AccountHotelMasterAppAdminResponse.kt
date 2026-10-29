package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import io.swagger.v3.oas.annotations.media.Schema

data class AccountHotelMasterAppAdminResponse(
	@Schema(description = "openapi.schema.AccountHotelMasterAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.AccountHotelMasterAppAdminResponse.loginId", example = "master@example.com")
	val loginId: String,
	@Schema(description = "openapi.schema.AccountHotelMasterAppAdminResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.AccountHotelMasterAppAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(master: HotelAdmin): AccountHotelMasterAppAdminResponse =
			AccountHotelMasterAppAdminResponse(checkNotNull(master.id), master.loginId, master.name, master.version)
	}
}
