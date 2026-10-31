package com.marco.assignment.handys.urbanstay.member.dto.app

import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.common.validation.Password
import com.marco.assignment.handys.urbanstay.common.validation.PatternThenMaxLength
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.member.entity.Member
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class MemberSignupAppRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = LoginId.PATTERN, max = Member.EMAIL_MAX_LENGTH, message = "{validation.email}")
	@Schema(
		description = "openapi.schema.MemberSignupAppRequest.email",
		example = "guest@example.com",
		pattern = LoginId.PATTERN,
		maxLength = Member.EMAIL_MAX_LENGTH,
	)
	val email: String,
	@NotBlank(message = "{validation.required}")
	@Password
	@Schema(
		description = "openapi.schema.MemberSignupAppRequest.password",
		example = "urbanstay123!",
		minLength = Password.MIN_LENGTH,
		maxLength = Password.MAX_LENGTH,
		pattern = Password.PATTERN,
	)
	val password: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = Member.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.MemberSignupAppRequest.name", example = "홍길동", maxLength = Member.NAME_MAX_LENGTH)
	val name: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = Hotel.PHONE_PATTERN, max = Member.PHONE_MAX_LENGTH, message = "{validation.phone}")
	@Schema(
		description = "openapi.schema.MemberSignupAppRequest.phone",
		example = "010-1234-5678",
		pattern = Hotel.PHONE_PATTERN,
		maxLength = Member.PHONE_MAX_LENGTH,
	)
	val phone: String,
)
