package com.marco.assignment.handys.urbanstay.room.dto.appadmin

import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import io.swagger.v3.oas.annotations.media.Schema

data class RoomRoomTypeAppAdminResponse(
	@Schema(description = "openapi.schema.RoomRoomTypeAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomRoomTypeAppAdminResponse.name", example = "스탠다드")
	val name: String,
) {

	companion object {

		fun from(roomType: RoomType): RoomRoomTypeAppAdminResponse = RoomRoomTypeAppAdminResponse(checkNotNull(roomType.id), roomType.name)
	}
}
