package com.marco.assignment.handys.urbanstay.room.dto.appadmin

import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import io.swagger.v3.oas.annotations.media.Schema

data class RoomAppAdminResponse(
	@Schema(description = "openapi.schema.RoomAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomAppAdminResponse.name", example = "101")
	val name: String,
	@Schema(description = "openapi.schema.RoomAppAdminResponse.roomType")
	val roomType: RoomRoomTypeAppAdminResponse,
	@Schema(description = "openapi.schema.RoomAppAdminResponse.floor", example = "1")
	val floor: Int?,
	@Schema(description = "openapi.schema.RoomAppAdminResponse.status", example = "VACANT")
	val status: RoomStatus,
) {

	companion object {

		fun from(room: Room): RoomAppAdminResponse =
			RoomAppAdminResponse(
				id = checkNotNull(room.id),
				name = room.name,
				roomType = RoomRoomTypeAppAdminResponse.from(room.roomType),
				floor = room.floor,
				status = room.status,
			)
	}
}
