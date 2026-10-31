package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.common.validation.PatternThenMaxLength
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class StayGuestCreateAppRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = Guest.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.StayGuestCreateAppRequest.name", example = "홍길동", maxLength = Guest.NAME_MAX_LENGTH)
	val name: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = Hotel.PHONE_PATTERN, max = Guest.PHONE_MAX_LENGTH, message = "{validation.phone}")
	@Schema(
		description = "openapi.schema.StayGuestCreateAppRequest.phone",
		example = "010-1234-5678",
		pattern = Hotel.PHONE_PATTERN,
		maxLength = Guest.PHONE_MAX_LENGTH,
	)
	val phone: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = LoginId.PATTERN, max = Guest.EMAIL_MAX_LENGTH, message = "{validation.email}")
	@Schema(
		description = "openapi.schema.StayGuestCreateAppRequest.email",
		example = "guest@example.com",
		pattern = LoginId.PATTERN,
		maxLength = Guest.EMAIL_MAX_LENGTH,
	)
	val email: String,
)
