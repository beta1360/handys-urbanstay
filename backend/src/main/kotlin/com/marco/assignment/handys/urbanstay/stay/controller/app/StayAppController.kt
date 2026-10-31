package com.marco.assignment.handys.urbanstay.stay.controller.app

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelApiErrors
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.room.exception.RoomApiErrors
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.stay.dto.app.StayAppResponse
import com.marco.assignment.handys.urbanstay.stay.dto.app.StayCreateAppRequest
import com.marco.assignment.handys.urbanstay.stay.dto.app.StayRoomTypeAppResponse
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.exception.StayApiErrors
import com.marco.assignment.handys.urbanstay.stay.exception.StayErrorCode
import com.marco.assignment.handys.urbanstay.stay.service.StayService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
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
import java.time.LocalDate

@Tag(name = "stay", description = "openapi.app.tag.stay")
@RestController
@RequestMapping(ApiPaths.APP)
class StayAppController(
	private val stayService: StayService,
) {

	@Operation(summary = "openapi.app.operation.getHotelRoomTypes.summary", description = "openapi.app.operation.getHotelRoomTypes.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND)
	@GetMapping("/hotels/{hotelId}/room-types")
	fun getHotelRoomTypes(
		@PathVariable hotelId: Long,
		@RequestParam
		@Parameter(description = "openapi.app.operation.getHotelRoomTypes.parameter.checkInDate", example = "2026-11-02")
		checkInDate: LocalDate,
		@RequestParam
		@Parameter(description = "openapi.app.operation.getHotelRoomTypes.parameter.checkOutDate", example = "2026-11-04")
		checkOutDate: LocalDate,
		@RequestParam
		@Min(value = Stay.MIN_GUEST_COUNT, message = "{validation.min}")
		@Parameter(description = "openapi.app.operation.getHotelRoomTypes.parameter.guestCount", example = "2")
		guestCount: Int,
	): ApiResponse<List<StayRoomTypeAppResponse>> =
		ApiResponse.success(stayService.getRoomTypes(hotelId, checkInDate, checkOutDate, guestCount).map(StayRoomTypeAppResponse::from))

	@Operation(summary = "openapi.app.operation.createStay.summary", description = "openapi.app.operation.createStay.description")
	@RoomApiErrors(RoomErrorCode.ROOM_TYPE_NOT_FOUND, RoomErrorCode.ROOM_TYPE_UNAVAILABLE)
	@StayApiErrors(StayErrorCode.STAY_PERIOD_OVERLAPPED)
	@SuccessMessage("success.stay.reserved")
	@PostMapping("/stays")
	@ResponseStatus(HttpStatus.CREATED)
	fun createStay(@Valid @RequestBody request: StayCreateAppRequest): ApiResponse<StayAppResponse> {
		val stay = stayService.reserve(
			hotelId = request.hotelId,
			roomTypeId = request.roomTypeId,
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
