package com.marco.assignment.handys.urbanstay.member.dto.app

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank

data class MemberLoginAppRequest(
	@NotBlank(message = "{validation.required}")
	@Schema(description = "openapi.schema.MemberLoginAppRequest.email", example = "guest@example.com")
	val email: String,
	@NotBlank(message = "{validation.required}")
	@Schema(description = "openapi.schema.MemberLoginAppRequest.password", example = "urbanstay123!")
	val password: String,
)
