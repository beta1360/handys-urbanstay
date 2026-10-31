package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalTime

data class RoomTypeHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomTypeHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomTypeHotelAdminResponse.name", example = "스탠다드")
	val name: String,
	@Schema(description = "openapi.schema.RoomTypeHotelAdminResponse.capacity", example = "2")
	val capacity: Int,
	@Schema(description = "openapi.schema.RoomTypeHotelAdminResponse.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.RoomTypeHotelAdminResponse.checkInTime", example = "15:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkInTime: LocalTime,
	@Schema(description = "openapi.schema.RoomTypeHotelAdminResponse.checkOutTime", example = "11:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkOutTime: LocalTime,
	@Schema(description = "openapi.schema.RoomTypeHotelAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(roomType: RoomType): RoomTypeHotelAdminResponse =
			RoomTypeHotelAdminResponse(
				id = checkNotNull(roomType.id),
				name = roomType.name,
				capacity = roomType.capacity,
				roomRate = roomType.roomRate,
				checkInTime = roomType.checkInTime,
				checkOutTime = roomType.checkOutTime,
				version = roomType.version,
			)
	}
}
