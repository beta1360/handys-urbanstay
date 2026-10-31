package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalTime

data class RoomRoomTypeHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomRoomTypeHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomRoomTypeHotelAdminResponse.name", example = "스탠다드")
	val name: String,
	@Schema(description = "openapi.schema.RoomRoomTypeHotelAdminResponse.capacity", example = "2")
	val capacity: Int,
	@Schema(description = "openapi.schema.RoomRoomTypeHotelAdminResponse.roomRate", example = "100000")
	val roomRate: Int,
	@Schema(description = "openapi.schema.RoomRoomTypeHotelAdminResponse.checkInTime", example = "15:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkInTime: LocalTime,
	@Schema(description = "openapi.schema.RoomRoomTypeHotelAdminResponse.checkOutTime", example = "11:00", pattern = JacksonConfig.LOCAL_TIME_PATTERN)
	val checkOutTime: LocalTime,
) {

	companion object {

		fun from(roomType: RoomType): RoomRoomTypeHotelAdminResponse =
			RoomRoomTypeHotelAdminResponse(
				id = checkNotNull(roomType.id),
				name = roomType.name,
				capacity = roomType.capacity,
				roomRate = roomType.roomRate,
				checkInTime = roomType.checkInTime,
				checkOutTime = roomType.checkOutTime,
			)
	}
}
