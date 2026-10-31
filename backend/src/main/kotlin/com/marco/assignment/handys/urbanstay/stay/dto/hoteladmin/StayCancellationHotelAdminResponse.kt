package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class StayCancellationHotelAdminResponse(
	@Schema(description = "openapi.schema.StayCancellationHotelAdminResponse.canceledAt", example = "2026-10-30T06:59:32.123456Z")
	val canceledAt: Instant,
	@Schema(description = "openapi.schema.StayCancellationHotelAdminResponse.canceledBy")
	val canceledBy: StayCanceledByHotelAdminResponse,
	@Schema(description = "openapi.schema.StayCancellationHotelAdminResponse.reason", example = "고객 요청으로 일정 변경")
	val reason: String?,
) {

	companion object {

		fun from(stay: Stay): StayCancellationHotelAdminResponse? {
			val canceledAt = stay.canceledAt ?: return null
			return StayCancellationHotelAdminResponse(
				canceledAt = canceledAt,
				canceledBy = StayCanceledByHotelAdminResponse(checkNotNull(stay.canceledBy?.id), checkNotNull(stay.canceledByName)),
				reason = stay.cancelReason,
			)
		}
	}
}
