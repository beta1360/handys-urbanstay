package com.marco.assignment.handys.urbanstay.account.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.common.validation.Password
import com.marco.assignment.handys.urbanstay.common.validation.PatternThenMaxLength
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class AccountHotelOperatorCreateHotelAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = LoginId.PATTERN, max = HotelAdmin.LOGIN_ID_MAX_LENGTH, message = "{validation.email}")
	@Schema(
		description = "openapi.schema.AccountHotelOperatorCreateHotelAdminRequest.loginId",
		example = "operator@example.com",
		pattern = LoginId.PATTERN,
		maxLength = HotelAdmin.LOGIN_ID_MAX_LENGTH,
	)
	val loginId: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = HotelAdmin.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.AccountHotelOperatorCreateHotelAdminRequest.name", example = "김운영", maxLength = HotelAdmin.NAME_MAX_LENGTH)
	val name: String,
	@NotBlank(message = "{validation.required}")
	@Password
	@Schema(
		description = "openapi.schema.AccountHotelOperatorCreateHotelAdminRequest.password",
		example = "urbanstay123!",
		minLength = Password.MIN_LENGTH,
		maxLength = Password.MAX_LENGTH,
		pattern = Password.PATTERN,
	)
	val password: String,
)
