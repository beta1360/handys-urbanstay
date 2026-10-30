package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.room.entity.RoomStatusHistory
import io.swagger.v3.oas.annotations.media.Schema

data class RoomStatusHistoryChangedByHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomStatusHistoryChangedByHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomStatusHistoryChangedByHotelAdminResponse.name", example = "홍길동")
	val name: String,
) {

	companion object {

		fun from(history: RoomStatusHistory): RoomStatusHistoryChangedByHotelAdminResponse =
			RoomStatusHistoryChangedByHotelAdminResponse(checkNotNull(history.changedBy.id), history.changedByName)
	}
}
