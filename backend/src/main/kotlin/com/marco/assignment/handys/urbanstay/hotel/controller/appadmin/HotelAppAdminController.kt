package com.marco.assignment.handys.urbanstay.hotel.controller.appadmin

import com.marco.assignment.handys.urbanstay.account.exception.AccountApiErrors
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringEditor
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.hotel.dto.appadmin.HotelAppAdminResponse
import com.marco.assignment.handys.urbanstay.hotel.dto.appadmin.HotelCreateAppAdminRequest
import com.marco.assignment.handys.urbanstay.hotel.dto.appadmin.HotelUpdateAppAdminRequest
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelApiErrors
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
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

@Tag(name = "hotel", description = "openapi.app-admin.tag.hotel")
@RestController
@RequestMapping(ApiPaths.APP_ADMIN + "/hotels")
class HotelAppAdminController(
	private val hotelService: HotelService,
) {

	@Operation(summary = "openapi.app-admin.operation.createHotel.summary", description = "openapi.app-admin.operation.createHotel.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_DUPLICATED)
	@AccountApiErrors(AccountErrorCode.LOGIN_ID_DUPLICATED)
	@SuccessMessage("success.hotel.created")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun createHotel(@Valid @RequestBody request: HotelCreateAppAdminRequest): ApiResponse<HotelAppAdminResponse> {
		val hotel = hotelService.create(
			name = request.name,
			address = request.address,
			phone = request.phone,
			description = request.description,
			masterLoginId = request.master.loginId,
			masterName = request.master.name,
			masterPassword = request.master.password,
		)
		return ApiResponse.success(HotelAppAdminResponse.from(hotel))
	}

	@InitBinder
	fun trimRequestParameters(binder: WebDataBinder) {
		binder.registerCustomEditor(String::class.java, TrimmedStringEditor())
	}

	@Operation(summary = "openapi.app-admin.operation.getHotels.summary", description = "openapi.app-admin.operation.getHotels.description")
	@GetMapping
	fun getHotels(
		@RequestParam(required = false)
		@Size(max = KEYWORD_MAX_LENGTH, message = "{validation.max-length}")
		@Parameter(description = "openapi.app-admin.operation.getHotels.parameter.keyword")
		keyword: String?,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getHotels.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getHotels.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<HotelAppAdminResponse>> =
		ApiResponse.success(PageResponse.from(hotelService.getHotels(keyword, page, size).map(HotelAppAdminResponse::from)))

	@Operation(summary = "openapi.app-admin.operation.getHotel.summary", description = "openapi.app-admin.operation.getHotel.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND)
	@GetMapping("/{hotelId}")
	fun getHotel(@PathVariable hotelId: Long): ApiResponse<HotelAppAdminResponse> =
		ApiResponse.success(HotelAppAdminResponse.from(hotelService.getHotel(hotelId)))

	@Operation(summary = "openapi.app-admin.operation.updateHotel.summary", description = "openapi.app-admin.operation.updateHotel.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND, HotelErrorCode.HOTEL_DUPLICATED, HotelErrorCode.HOTEL_MODIFIED)
	@SuccessMessage("success.hotel.updated")
	@PutMapping("/{hotelId}")
	fun updateHotel(
		@PathVariable hotelId: Long,
		@Valid @RequestBody request: HotelUpdateAppAdminRequest,
	): ApiResponse<HotelAppAdminResponse> {
		val hotel = hotelService.update(hotelId, request.version, request.name, request.address, request.phone, request.description)
		return ApiResponse.success(HotelAppAdminResponse.from(hotel))
	}

	companion object {
		const val KEYWORD_MAX_LENGTH = 100
	}
}
