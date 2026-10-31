package com.marco.assignment.handys.urbanstay.stay.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringEditor
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin.StayCancelHotelAdminRequest
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
import jakarta.validation.constraints.Size
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.WebDataBinder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.InitBinder
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@Tag(name = "stay", description = "openapi.hotel-admin.tag.stay")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + "/stays")
class StayHotelAdminController(
	private val stayService: StayService,
) {

	@InitBinder
	fun trimRequestParameters(binder: WebDataBinder) {
		binder.registerCustomEditor(String::class.java, TrimmedStringEditor())
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
		@RequestParam(required = false)
		@Size(max = KEYWORD_MAX_LENGTH, message = "{validation.max-length}")
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.keyword")
		keyword: String?,
		@RequestParam(required = false)
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.checkInFrom")
		checkInFrom: LocalDate?,
		@RequestParam(required = false)
		@Parameter(description = "openapi.hotel-admin.operation.getStays.parameter.checkInTo")
		checkInTo: LocalDate?,
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
	): ApiResponse<PageResponse<StayHotelAdminResponse>> {
		val stays = stayService.getStays(hotelAdmin.hotelId, roomId, guestId, canceled, keyword, checkInFrom, checkInTo, page, size)
		return ApiResponse.success(PageResponse.from(stays.map(StayHotelAdminResponse::from)))
	}

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

	companion object {
		const val KEYWORD_MAX_LENGTH = 100
	}
}
