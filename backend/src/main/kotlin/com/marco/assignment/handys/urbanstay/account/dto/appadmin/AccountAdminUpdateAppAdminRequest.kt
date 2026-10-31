package com.marco.assignment.handys.urbanstay.account.dto.appadmin

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class AccountAdminUpdateAppAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = AppAdmin.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.AccountAdminUpdateAppAdminRequest.name", example = "김어드민", maxLength = AppAdmin.NAME_MAX_LENGTH)
	val name: String,
	@Schema(description = "openapi.schema.AccountAdminUpdateAppAdminRequest.version", example = "0")
	val version: Long,
)
