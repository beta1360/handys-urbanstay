package com.marco.assignment.handys.urbanstay.room.controller.appadmin

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelApiErrors
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.room.dto.appadmin.RoomAppAdminResponse
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

@Tag(name = "room", description = "openapi.app-admin.tag.room")
@RestController
@RequestMapping(ApiPaths.APP_ADMIN + "/hotels/{hotelId}/rooms")
class RoomAppAdminController(
	private val roomService: RoomService,
) {

	@Operation(summary = "openapi.app-admin.operation.getHotelRooms.summary", description = "openapi.app-admin.operation.getHotelRooms.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND)
	@GetMapping
	fun getHotelRooms(
		@PathVariable hotelId: Long,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getHotelRooms.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getHotelRooms.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<RoomAppAdminResponse>> =
		ApiResponse.success(PageResponse.from(roomService.getHotelRoomPage(hotelId, page, size).map(RoomAppAdminResponse::from)))
}
