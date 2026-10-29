package com.marco.assignment.handys.urbanstay.hotel.dto.appadmin

import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.common.validation.PatternThenMaxLength
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class HotelCreateAppAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = Hotel.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.HotelCreateAppAdminRequest.name", example = "어반스테이 강남", maxLength = Hotel.NAME_MAX_LENGTH)
	val name: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = Hotel.ADDRESS_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.HotelCreateAppAdminRequest.address", example = "서울특별시 강남구 테헤란로 123", maxLength = Hotel.ADDRESS_MAX_LENGTH)
	val address: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@PatternThenMaxLength(regexp = Hotel.PHONE_PATTERN, max = Hotel.PHONE_MAX_LENGTH, message = "{validation.phone}")
	@Schema(description = "openapi.schema.HotelCreateAppAdminRequest.phone", example = "02-1234-5678", pattern = Hotel.PHONE_PATTERN, maxLength = Hotel.PHONE_MAX_LENGTH)
	val phone: String,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@Size(max = Hotel.DESCRIPTION_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.HotelCreateAppAdminRequest.description", example = "강남역에서 걸어서 5분 거리의 비즈니스 호텔입니다.")
	val description: String?,
)
