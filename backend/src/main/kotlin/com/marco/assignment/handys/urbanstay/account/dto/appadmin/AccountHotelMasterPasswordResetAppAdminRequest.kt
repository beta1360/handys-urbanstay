package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import com.marco.assignment.handys.urbanstay.common.validation.Password
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank

data class AccountHotelMasterPasswordResetAppAdminRequest(
	@NotBlank(message = "{validation.required}")
	@Password
	@Schema(
		description = "openapi.schema.AccountHotelMasterPasswordResetAppAdminRequest.password",
		example = "urbanstay123!",
		minLength = Password.MIN_LENGTH,
		maxLength = Password.MAX_LENGTH,
		pattern = Password.PATTERN,
	)
	val password: String,
)
