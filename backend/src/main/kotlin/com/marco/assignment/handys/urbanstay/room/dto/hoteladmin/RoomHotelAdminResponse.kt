package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema

data class RoomHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.name", example = "101")
	val name: String,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.roomType")
	val roomType: RoomRoomTypeHotelAdminResponse,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.floor", example = "1")
	val floor: Int?,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.description", example = "도심이 보이는 퀸 침대 객실입니다.")
	val description: String?,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.status", example = "VACANT")
	val status: RoomStatus,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.currentStay")
	val currentStay: RoomCurrentStayHotelAdminResponse?,
	@Schema(description = "openapi.schema.RoomHotelAdminResponse.version", example = "0")
	val version: Long,
) {

	companion object {

		fun from(room: Room, currentStay: Stay?): RoomHotelAdminResponse =
			RoomHotelAdminResponse(
				id = checkNotNull(room.id),
				name = room.name,
				roomType = RoomRoomTypeHotelAdminResponse.from(room.roomType),
				floor = room.floor,
				description = room.description,
				status = room.status,
				currentStay = currentStay?.let(RoomCurrentStayHotelAdminResponse::from),
				version = room.version,
			)
	}
}
