package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalTime

data class RoomHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.name", example = "101")
	val name: String,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.type", example = "스탠다드")
	val type: String,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.capacity", example = "2")
	val capacity: Int,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.floor", example = "1")
	val floor: Int?,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.description", example = "도심이 보이는 퀸 침대 객실입니다.")
	val description: String?,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.checkInTime", example = "15:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkInTime: LocalTime,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.checkOutTime", example = "11:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkOutTime: LocalTime,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.status", example = "VACANT")
	val status: RoomStatus,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(room: Room): RoomHotelAdminResponse =
			RoomHotelAdminResponse(
				id = checkNotNull(room.id),
				name = room.name,
				type = room.type,
				capacity = room.capacity,
				floor = room.floor,
				description = room.description,
				checkInTime = room.checkInTime,
				checkOutTime = room.checkOutTime,
				status = room.status,
				version = room.version,
			)
	}
}
