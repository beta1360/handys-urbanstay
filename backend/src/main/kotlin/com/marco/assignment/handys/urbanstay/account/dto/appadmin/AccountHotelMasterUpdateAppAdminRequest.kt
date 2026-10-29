package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.common.validation.PatternThenMaxLength
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class AccountHotelMasterUpdateAppAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = LoginId.PATTERN, max = HotelAdmin.LOGIN_ID_MAX_LENGTH, message = "{validation.email}")
	@Schema(
		description = "openapi.schema.AccountHotelMasterUpdateAppAdminRequest.loginId",
		example = "master@example.com",
		pattern = LoginId.PATTERN,
		maxLength = HotelAdmin.LOGIN_ID_MAX_LENGTH,
	)
	val loginId: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = HotelAdmin.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.AccountHotelMasterUpdateAppAdminRequest.name", example = "홍길동", maxLength = HotelAdmin.NAME_MAX_LENGTH)
	val name: String,
	@Schema(description = "openapi.schema.AccountHotelMasterUpdateAppAdminRequest.version", example = "0")
	val version: Long,
)
