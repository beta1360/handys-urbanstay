package com.marco.assignment.handys.urbanstay.account.dto.hoteladmin

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank

data class AccountLoginHotelAdminRequest(
	@NotBlank(message = "{validation.required}")
	@Schema(description = "openapi.schema.AccountLoginHotelAdminRequest.loginId", example = "master@example.com")
	val loginId: String,
	@NotBlank(message = "{validation.required}")
	@Schema(description = "openapi.schema.AccountLoginHotelAdminRequest.password", example = "urbanstay123!")
	val password: String,
)
