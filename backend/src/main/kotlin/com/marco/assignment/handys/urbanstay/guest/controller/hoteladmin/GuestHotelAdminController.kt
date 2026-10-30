package com.marco.assignment.handys.urbanstay.guest.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringEditor
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin.GuestCreateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin.GuestHotelAdminResponse
import com.marco.assignment.handys.urbanstay.guest.dto.hoteladmin.GuestUpdateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.guest.exception.GuestApiErrors
import com.marco.assignment.handys.urbanstay.guest.exception.GuestErrorCode
import com.marco.assignment.handys.urbanstay.guest.service.GuestService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.WebDataBinder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.InitBinder
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(name = "guest", description = "openapi.hotel-admin.tag.guest")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + "/guests")
class GuestHotelAdminController(
	private val guestService: GuestService,
) {

	@InitBinder
	fun trimRequestParameters(binder: WebDataBinder) {
		binder.registerCustomEditor(String::class.java, TrimmedStringEditor())
	}

	@Operation(summary = "openapi.hotel-admin.operation.createGuest.summary", description = "openapi.hotel-admin.operation.createGuest.description")
	@GuestApiErrors(GuestErrorCode.GUEST_PHONE_DUPLICATED)
	@SuccessMessage("success.guest.created")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun createGuest(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@Valid @RequestBody request: GuestCreateHotelAdminRequest,
	): ApiResponse<GuestHotelAdminResponse> {
		val guest = guestService.create(hotelId = hotelAdmin.hotelId, name = request.name, phone = request.phone, email = request.email)
		return ApiResponse.success(GuestHotelAdminResponse.from(guest))
	}

	@Operation(summary = "openapi.hotel-admin.operation.getGuests.summary", description = "openapi.hotel-admin.operation.getGuests.description")
	@GetMapping
	fun getGuests(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@RequestParam(required = false)
		@Size(max = KEYWORD_MAX_LENGTH, message = "{validation.max-length}")
		@Parameter(description = "openapi.hotel-admin.operation.getGuests.parameter.keyword")
		keyword: String?,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getGuests.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getGuests.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<GuestHotelAdminResponse>> =
		ApiResponse.success(PageResponse.from(guestService.getGuests(hotelAdmin.hotelId, keyword, page, size).map(GuestHotelAdminResponse::from)))

	@Operation(summary = "openapi.hotel-admin.operation.getGuest.summary", description = "openapi.hotel-admin.operation.getGuest.description")
	@GuestApiErrors(GuestErrorCode.GUEST_NOT_FOUND)
	@GetMapping("/{guestId}")
	fun getGuest(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable guestId: Long,
	): ApiResponse<GuestHotelAdminResponse> =
		ApiResponse.success(GuestHotelAdminResponse.from(guestService.getGuest(hotelAdmin.hotelId, guestId)))

	@Operation(summary = "openapi.hotel-admin.operation.updateGuest.summary", description = "openapi.hotel-admin.operation.updateGuest.description")
	@GuestApiErrors(GuestErrorCode.GUEST_NOT_FOUND, GuestErrorCode.GUEST_PHONE_DUPLICATED, GuestErrorCode.GUEST_MODIFIED)
	@SuccessMessage("success.guest.updated")
	@PutMapping("/{guestId}")
	fun updateGuest(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable guestId: Long,
		@Valid @RequestBody request: GuestUpdateHotelAdminRequest,
	): ApiResponse<GuestHotelAdminResponse> {
		val guest = guestService.update(
			hotelId = hotelAdmin.hotelId,
			guestId = guestId,
			version = request.version,
			name = request.name,
			phone = request.phone,
			email = request.email,
		)
		return ApiResponse.success(GuestHotelAdminResponse.from(guest))
	}

	companion object {
		const val KEYWORD_MAX_LENGTH = 100
	}
}
