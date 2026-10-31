package com.marco.assignment.handys.urbanstay.hotel.controller.app

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.hotel.dto.app.HotelAppResponse
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "hotel", description = "openapi.app.tag.hotel")
@RestController
@RequestMapping(ApiPaths.APP + "/hotels")
class HotelAppController(
	private val hotelService: HotelService,
) {

	@Operation(summary = "openapi.app.operation.getHotels.summary", description = "openapi.app.operation.getHotels.description")
	@GetMapping
	fun getHotels(
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app.operation.getHotels.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app.operation.getHotels.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<HotelAppResponse>> =
		ApiResponse.success(PageResponse.from(hotelService.getHotelsWithRoomCount(page, size).map(HotelAppResponse::from)))
}
