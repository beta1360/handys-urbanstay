package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import io.swagger.v3.oas.annotations.media.Schema

data class StayGuestAppResponse(
	@Schema(description = "openapi.schema.StayGuestAppResponse.name", example = "홍길동")
	val name: String,
) {

	companion object {

		fun from(guest: Guest): StayGuestAppResponse = StayGuestAppResponse(guest.name)
	}
}
