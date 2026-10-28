package com.marco.assignment.handys.urbanstay.account.config

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.validation.annotation.Validated

@ConfigurationProperties("urbanstay.initial-admin")
@Validated
class InitialAdminProperties(
	@NotBlank
	@Email
	@Size(max = AppAdmin.LOGIN_ID_MAX_LENGTH)
	val loginId: String,
	@NotBlank
	val password: String,
	@NotBlank
	@Size(max = AppAdmin.NAME_MAX_LENGTH)
	val name: String,
)
