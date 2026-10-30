package com.marco.assignment.handys.urbanstay.room.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatusHistory
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class RoomStatusHistoryHotelAdminResponse(
	@Schema(description = "openapi.schema.RoomStatusHistoryHotelAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.RoomStatusHistoryHotelAdminResponse.fromStatus", example = "VACANT")
	val fromStatus: RoomStatus?,
	@Schema(description = "openapi.schema.RoomStatusHistoryHotelAdminResponse.toStatus", example = "RESERVED")
	val toStatus: RoomStatus,
	@Schema(description = "openapi.schema.RoomStatusHistoryHotelAdminResponse.changedBy")
	val changedBy: RoomStatusHistoryChangedByHotelAdminResponse,
	@Schema(description = "openapi.schema.RoomStatusHistoryHotelAdminResponse.changedAt", example = "2026-10-30T06:59:32.123456Z")
	val changedAt: Instant,
) {

	companion object {

		fun from(history: RoomStatusHistory): RoomStatusHistoryHotelAdminResponse =
			RoomStatusHistoryHotelAdminResponse(
				id = checkNotNull(history.id),
				fromStatus = history.fromStatus,
				toStatus = history.toStatus,
				changedBy = RoomStatusHistoryChangedByHotelAdminResponse.from(history),
				changedAt = history.createdAt,
			)
	}
}
