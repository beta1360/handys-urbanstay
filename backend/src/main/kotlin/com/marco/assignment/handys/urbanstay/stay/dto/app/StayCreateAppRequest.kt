package com.marco.assignment.handys.urbanstay.stay.dto.app

import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize
import java.time.LocalDate

data class StayCreateAppRequest(
	@Schema(description = "openapi.schema.StayCreateAppRequest.hotelId", example = "1")
	val hotelId: Long,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = Room.TYPE_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.StayCreateAppRequest.roomType", example = "스탠다드", maxLength = Room.TYPE_MAX_LENGTH)
	val roomType: String,
	@Schema(description = "openapi.schema.StayCreateAppRequest.checkInDate", example = "2026-11-02")
	val checkInDate: LocalDate,
	@Schema(description = "openapi.schema.StayCreateAppRequest.checkOutDate", example = "2026-11-04")
	val checkOutDate: LocalDate,
	@Min(value = Stay.MIN_GUEST_COUNT, message = "{validation.min}")
	@Schema(description = "openapi.schema.StayCreateAppRequest.guestCount", example = "2")
	val guestCount: Int,
	@Valid
	@Schema(description = "openapi.schema.StayCreateAppRequest.guest")
	val guest: StayGuestCreateAppRequest,
)
