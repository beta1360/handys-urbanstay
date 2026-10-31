package com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin

import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringDeserializer
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size
import tools.jackson.databind.annotation.JsonDeserialize

data class StayCancelHotelAdminRequest(
	@JsonDeserialize(using = TrimmedStringDeserializer::class)
	@Size(max = Stay.CANCEL_REASON_MAX_LENGTH, message = "{validation.max-length}")
	@Schema(description = "openapi.schema.StayCancelHotelAdminRequest.reason", example = "고객 요청으로 일정 변경")
	val reason: String?,
)
