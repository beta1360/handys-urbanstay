package com.marco.assignment.handys.urbanstay.room.controller.app

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelApiErrors
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.room.dto.app.RoomAppResponse
import com.marco.assignment.handys.urbanstay.room.service.RoomService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "room", description = "openapi.app.tag.room")
@RestController
@RequestMapping(ApiPaths.APP)
class RoomAppController(
	private val roomService: RoomService,
) {

	@Operation(summary = "openapi.app.operation.getHotelRooms.summary", description = "openapi.app.operation.getHotelRooms.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND)
	@GetMapping("/hotels/{hotelId}/rooms")
	fun getHotelRooms(
		@PathVariable hotelId: Long,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app.operation.getHotelRooms.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app.operation.getHotelRooms.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<RoomAppResponse>> =
		ApiResponse.success(PageResponse.from(roomService.getHotelRooms(hotelId, page, size).map(RoomAppResponse::from)))
}
