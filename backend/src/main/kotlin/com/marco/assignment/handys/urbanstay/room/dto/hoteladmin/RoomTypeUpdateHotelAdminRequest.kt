package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.Length
import tools.jackson.databind.annotation.JsonDeserialize
import java.time.LocalTime

data class RoomTypeUpdateHotelAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@NotBlank(message = "{validation.required}")
	@Length(max = RoomType.NAME_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.RoomTypeUpdateHotelAdminRequest.name", example = "스탠다드", maxLength = RoomType.NAME_MAX_LENGTH)
	val name: String,
	@Min(value = RoomType.MIN_CAPACITY, message = "{validation.min}")
	@Max(value = RoomType.MAX_CAPACITY, message = "{validation.max}")
	@Schema(description = "openapi.schema.RoomTypeUpdateHotelAdminRequest.capacity", example = "2")
	val capacity: Int,
	@Min(value = RoomType.MIN_ROOM_RATE, message = "{validation.min}")
	@Max(value = RoomType.MAX_ROOM_RATE, message = "{validation.max}")
	@Schema(description = "openapi.schema.RoomTypeUpdateHotelAdminRequest.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.RoomTypeUpdateHotelAdminRequest.checkInTime", example = "15:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkInTime: LocalTime,
	@Schema(description = "openapi.schema.RoomTypeUpdateHotelAdminRequest.checkOutTime", example = "11:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkOutTime: LocalTime,
	@Schema(description = "openapi.schema.RoomTypeUpdateHotelAdminRequest.version", example = "0")
	val version: Long,
)
