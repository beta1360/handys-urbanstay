package com.marco.assignment.handys.urbanstay.account.dto.hoteladmin

import io.swagger.v3.oas.annotations.media.Schema

data class AccountHotelOperatorActiveUpdateHotelAdminRequest(
	@Schema(description = "openapi.schema.AccountHotelOperatorActiveUpdateHotelAdminRequest.active", example = "false")
	val active: Boolean,
)
