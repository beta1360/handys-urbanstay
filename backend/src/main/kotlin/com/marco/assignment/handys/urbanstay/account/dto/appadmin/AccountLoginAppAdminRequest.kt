package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank

data class AccountLoginAppAdminRequest(
	@NotBlank(message = "{validation.required}")
	@Schema(description = "openapi.schema.AccountLoginAppAdminRequest.loginId", example = "admin@example.com")
	val loginId: String,
	@NotBlank(message = "{validation.required}")
	@Schema(description = "openapi.schema.AccountLoginAppAdminRequest.password", example = "password")
	val password: String,
)
