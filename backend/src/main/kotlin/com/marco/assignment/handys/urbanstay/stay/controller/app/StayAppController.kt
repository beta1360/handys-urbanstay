package com.marco.assignment.handys.urbanstay.stay.controller.app

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.room.exception.RoomApiErrors
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.stay.dto.app.StayAppResponse
import com.marco.assignment.handys.urbanstay.stay.dto.app.StayCreateAppRequest
import com.marco.assignment.handys.urbanstay.stay.dto.app.StayReservedPeriodAppResponse
import com.marco.assignment.handys.urbanstay.stay.exception.StayApiErrors
import com.marco.assignment.handys.urbanstay.stay.exception.StayErrorCode
import com.marco.assignment.handys.urbanstay.stay.service.StayService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(name = "stay", description = "openapi.app.tag.stay")
@RestController
@RequestMapping(ApiPaths.APP)
class StayAppController(
	private val stayService: StayService,
) {

	@Operation(
		summary = "openapi.app.operation.getRoomReservedPeriods.summary",
		description = "openapi.app.operation.getRoomReservedPeriods.description",
	)
	@RoomApiErrors(RoomErrorCode.ROOM_NOT_FOUND)
	@GetMapping("/rooms/{roomId}/reserved-periods")
	fun getRoomReservedPeriods(
		@PathVariable roomId: Long,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app.operation.getRoomReservedPeriods.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app.operation.getRoomReservedPeriods.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<StayReservedPeriodAppResponse>> =
		ApiResponse.success(PageResponse.from(stayService.getReservedPeriods(roomId, page, size).map(StayReservedPeriodAppResponse::from)))

	@Operation(summary = "openapi.app.operation.createStay.summary", description = "openapi.app.operation.createStay.description")
	@RoomApiErrors(RoomErrorCode.ROOM_NOT_FOUND)
	@StayApiErrors(StayErrorCode.STAY_PERIOD_OVERLAPPED)
	@SuccessMessage("success.stay.reserved")
	@PostMapping("/stays")
	@ResponseStatus(HttpStatus.CREATED)
	fun createStay(@Valid @RequestBody request: StayCreateAppRequest): ApiResponse<StayAppResponse> {
		val stay = stayService.reserve(
			roomId = request.roomId,
			checkInDate = request.checkInDate,
			checkOutDate = request.checkOutDate,
			guestCount = request.guestCount,
			guestName = request.guest.name,
			guestPhone = request.guest.phone,
			guestEmail = request.guest.email,
		)
		return ApiResponse.success(StayAppResponse.from(stay))
	}
}
