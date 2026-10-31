package com.marco.assignment.handys.urbanstay.stay.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.guest.exception.GuestApiErrors
import com.marco.assignment.handys.urbanstay.guest.exception.GuestErrorCode
import com.marco.assignment.handys.urbanstay.room.exception.RoomApiErrors
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin.StayCancelHotelAdminRequest
import com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin.StayCreateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin.StayHotelAdminResponse
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
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(name = "stay", description = "openapi.hotel-admin.tag.stay")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + "/stays")
class StayHotelAdminController(
	private val stayService: StayService,
) {

	@Operation(summary = "openapi.hotel-admin.operation.createStay.summary", description = "openapi.hotel-admin.operation.createStay.description")
	@RoomApiErrors(RoomErrorCode.ROOM_NOT_FOUND)
	@GuestApiErrors(GuestErrorCode.GUEST_NOT_FOUND)
	@StayApiErrors(StayErrorCode.STAY_PERIOD_OVERLAPPED)
	@SuccessMessage("success.stay.created")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun createStay(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@Valid @RequestBody request: StayCreateHotelAdminRequest,
	): ApiResponse<StayHotelAdminResponse> {
		val stay = stayService.create(
			hotelId = hotelAdmin.hotelId,
			roomId = request.roomId,
			guestId = request.guestId,
			checkInDate = request.checkInDate,
			checkOutDate = request.checkOutDate,
			guestCount = request.guestCount,
		)
		return ApiResponse.success(StayHotelAdminResponse.from(stay))
	}

	@Operation(summary = "openapi.hotel-admin.operation.getStays.summary", description = "openapi.hotel-admin.operation.getStays.description")
	@GetMapping
	fun getStays(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@RequestParam(required = false)
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.roomId")
		roomId: Long?,
		@RequestParam(required = false)
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.guestId")
		guestId: Long?,
		@RequestParam(required = false)
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.canceled")
		canceled: Boolean?,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<StayHotelAdminResponse>> =
		ApiResponse.success(PageResponse.from(stayService.getStays(hotelAdmin.hotelId, roomId, guestId, canceled, page, size).map(StayHotelAdminResponse::from)))

	@Operation(summary = "openapi.hotel-admin.operation.getStay.summary", description = "openapi.hotel-admin.operation.getStay.description")
	@StayApiErrors(StayErrorCode.STAY_NOT_FOUND)
	@GetMapping("/{stayId}")
	fun getStay(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable stayId: Long,
	): ApiResponse<StayHotelAdminResponse> =
		ApiResponse.success(StayHotelAdminResponse.from(stayService.getStay(hotelAdmin.hotelId, stayId)))

	@Operation(summary = "openapi.hotel-admin.operation.cancelStay.summary", description = "openapi.hotel-admin.operation.cancelStay.description")
	@StayApiErrors(StayErrorCode.STAY_NOT_FOUND, StayErrorCode.STAY_ALREADY_CANCELED, StayErrorCode.STAY_ALREADY_ENDED)
	@SuccessMessage("success.stay.canceled")
	@PostMapping("/{stayId}/cancel")
	fun cancelStay(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable stayId: Long,
		@Valid @RequestBody request: StayCancelHotelAdminRequest,
	): ApiResponse<StayHotelAdminResponse> =
		ApiResponse.success(StayHotelAdminResponse.from(stayService.cancel(hotelAdmin.hotelId, stayId, hotelAdmin.id, request.reason)))
}
