package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.room.entity.Room
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize

data class RoomUpdateHotelAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = Room.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.RoomUpdateHotelAdminRequest.name", example = "101", maxLength = Room.NAME_MAX_LENGTH)
	val name: String,
	@Schema(description = "openapi.schema.RoomUpdateHotelAdminRequest.roomTypeId", example = "1")
	val roomTypeId: Long,
	@Min(value = Room.MIN_FLOOR, message = "{validation.min}")
	@Max(value = Room.MAX_FLOOR, message = "{validation.max}")
	@Schema(description = "openapi.schema.RoomUpdateHotelAdminRequest.floor", example = "1")
	val floor: Int?,
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@Size(max = Room.DESCRIPTION_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.RoomUpdateHotelAdminRequest.description", example = "도심이 보이는 퀸 침대 객실입니다.")
	val description: String?,
	@Schema(description = "openapi.schema.RoomUpdateHotelAdminRequest.version", example = "0")
	val version: Long,
)
