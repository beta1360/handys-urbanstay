package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import io.swagger.v3.oas.annotations.media.Schema

data class AccountAppAdminResponse(
	@Schema(description = "openapi.schema.AccountAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.AccountAppAdminResponse.loginId", example = "admin@example.com")
	val loginId: String,
	@Schema(description = "openapi.schema.AccountAppAdminResponse.name", example = "Admin")
	val name: String,
) {

	companion object {

		fun from(admin: AppAdmin): AccountAppAdminResponse =
			AccountAppAdminResponse(checkNotNull(admin.id), admin.loginId, admin.name)
	}
}
