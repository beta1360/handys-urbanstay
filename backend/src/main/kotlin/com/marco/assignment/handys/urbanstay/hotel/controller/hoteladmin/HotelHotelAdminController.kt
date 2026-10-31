package com.marco.assignment.handys.urbanstay.hotel.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.hotel.dto.hoteladmin.HotelHotelAdminResponse
import com.marco.assignment.handys.urbanstay.hotel.dto.hoteladmin.HotelUpdateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelApiErrors
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "hotel", description = "openapi.hotel-admin.tag.hotel")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + ApiPaths.HOTEL)
class HotelHotelAdminController(
	private val hotelService: HotelService,
) {

	@Operation(summary = "openapi.hotel-admin.operation.getHotel.summary", description = "openapi.hotel-admin.operation.getHotel.description")
	@GetMapping
	fun getHotel(@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal): ApiResponse<HotelHotelAdminResponse> =
		ApiResponse.success(HotelHotelAdminResponse.from(hotelService.getHotel(hotelAdmin.hotelId)))

	@Operation(summary = "openapi.hotel-admin.operation.updateHotel.summary", description = "openapi.hotel-admin.operation.updateHotel.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_DUPLICATED, HotelErrorCode.HOTEL_MODIFIED)
	@SuccessMessage("success.hotel.updated")
	@PutMapping
	fun updateHotel(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@Valid @RequestBody request: HotelUpdateHotelAdminRequest,
	): ApiResponse<HotelHotelAdminResponse> {
		val hotel = hotelService.update(hotelAdmin.hotelId, request.version, request.name, request.address, request.phone, request.description)
		return ApiResponse.success(HotelHotelAdminResponse.from(hotel))
	}
}
