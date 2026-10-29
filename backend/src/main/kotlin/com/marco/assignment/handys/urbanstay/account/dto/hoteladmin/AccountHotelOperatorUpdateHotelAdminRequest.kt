package com.marco.assignment.handys.urbanstay.account.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.common.validation.PatternThenMaxLength
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class AccountHotelOperatorUpdateHotelAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = LoginId.PATTERN, max = HotelAdmin.LOGIN_ID_MAX_LENGTH, message = "{validation.email}")
	@Schema(
		description = "openapi.schema.AccountHotelOperatorUpdateHotelAdminRequest.loginId",
		example = "operator@example.com",
		pattern = LoginId.PATTERN,
		maxLength = HotelAdmin.LOGIN_ID_MAX_LENGTH,
	)
	val loginId: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = HotelAdmin.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.AccountHotelOperatorUpdateHotelAdminRequest.name", example = "김운영", maxLength = HotelAdmin.NAME_MAX_LENGTH)
	val name: String,
	@Schema(description = "openapi.schema.AccountHotelOperatorUpdateHotelAdminRequest.version", example = "0")
	val version: Long,
)
