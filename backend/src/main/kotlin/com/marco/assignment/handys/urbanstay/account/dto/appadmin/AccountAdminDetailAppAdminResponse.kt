package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class AccountAdminDetailAppAdminResponse(
	@Schema(description = "openapi.schema.AccountAdminDetailAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.AccountAdminDetailAppAdminResponse.loginId", example = "admin@example.com")
	val loginId: String,
	@Schema(description = "openapi.schema.AccountAdminDetailAppAdminResponse.name", example = "김어드민")
	val name: String,
	@Schema(description = "openapi.schema.AccountAdminDetailAppAdminResponse.createdAt", example = "2026-10-30T06:59:32.123456Z")
	val createdAt: Instant,
	@Schema(description = "openapi.schema.AccountAdminDetailAppAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(admin: AppAdmin): AccountAdminDetailAppAdminResponse =
			AccountAdminDetailAppAdminResponse(checkNotNull(admin.id), admin.loginId, admin.name, admin.createdAt, admin.version)
	}
}
