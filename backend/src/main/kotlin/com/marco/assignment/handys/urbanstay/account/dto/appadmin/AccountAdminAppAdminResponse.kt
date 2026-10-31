package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class AccountAdminAppAdminResponse(
	@Schema(description = "openapi.schema.AccountAdminAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.AccountAdminAppAdminResponse.loginId", example = "admin@example.com")
	val loginId: String,
	@Schema(description = "openapi.schema.AccountAdminAppAdminResponse.name", example = "김어드민")
	val name: String,
	@Schema(description = "openapi.schema.AccountAdminAppAdminResponse.createdAt", example = "2026-10-30T06:59:32.123456Z")
	val createdAt: Instant,
) {

	companion object {

		fun from(admin: AppAdmin): AccountAdminAppAdminResponse =
			AccountAdminAppAdminResponse(checkNotNull(admin.id), admin.loginId, admin.name, admin.createdAt)
	}
}
