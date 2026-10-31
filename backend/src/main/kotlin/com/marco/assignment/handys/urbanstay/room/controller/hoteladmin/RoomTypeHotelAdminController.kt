package com.marco.assignment.handys.urbanstay.room.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomTypeCreateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomTypeHotelAdminResponse
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomTypeUpdateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.room.exception.RoomApiErrors
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.service.RoomTypeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(name = "room", description = "openapi.hotel-admin.tag.room")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + ApiPaths.ROOM_TYPES)
class RoomTypeHotelAdminController(
	private val roomTypeService: RoomTypeService,
) {

	@Operation(summary = "openapi.hotel-admin.operation.createRoomType.summary", description = "openapi.hotel-admin.operation.createRoomType.description")
	@RoomApiErrors(RoomErrorCode.ROOM_TYPE_DUPLICATED)
	@SuccessMessage("success.room-type.created")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun createRoomType(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@Valid @RequestBody request: RoomTypeCreateHotelAdminRequest,
	): ApiResponse<RoomTypeHotelAdminResponse> {
		val roomType = roomTypeService.create(
			hotelId = hotelAdmin.hotelId,
			name = request.name,
			capacity = request.capacity,
			roomRate = request.roomRate,
			checkInTime = request.checkInTime,
			checkOutTime = request.checkOutTime,
		)
		return ApiResponse.success(RoomTypeHotelAdminResponse.from(roomType))
	}

	@Operation(summary = "openapi.hotel-admin.operation.getRoomTypes.summary", description = "openapi.hotel-admin.operation.getRoomTypes.description")
	@GetMapping
	fun getRoomTypes(@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal): ApiResponse<List<RoomTypeHotelAdminResponse>> =
		ApiResponse.success(roomTypeService.getRoomTypes(hotelAdmin.hotelId).map(RoomTypeHotelAdminResponse::from))

	@Operation(summary = "openapi.hotel-admin.operation.getRoomType.summary", description = "openapi.hotel-admin.operation.getRoomType.description")
	@RoomApiErrors(RoomErrorCode.ROOM_TYPE_NOT_FOUND)
	@GetMapping("/{roomTypeId}")
	fun getRoomType(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable roomTypeId: Long,
	): ApiResponse<RoomTypeHotelAdminResponse> =
		ApiResponse.success(RoomTypeHotelAdminResponse.from(roomTypeService.getRoomType(hotelAdmin.hotelId, roomTypeId)))

	@Operation(summary = "openapi.hotel-admin.operation.updateRoomType.summary", description = "openapi.hotel-admin.operation.updateRoomType.description")
	@RoomApiErrors(RoomErrorCode.ROOM_TYPE_NOT_FOUND, RoomErrorCode.ROOM_TYPE_DUPLICATED, RoomErrorCode.ROOM_TYPE_MODIFIED)
	@SuccessMessage("success.room-type.updated")
	@PutMapping("/{roomTypeId}")
	fun updateRoomType(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable roomTypeId: Long,
		@Valid @RequestBody request: RoomTypeUpdateHotelAdminRequest,
	): ApiResponse<RoomTypeHotelAdminResponse> {
		val roomType = roomTypeService.update(
			hotelId = hotelAdmin.hotelId,
			roomTypeId = roomTypeId,
			version = request.version,
			name = request.name,
			capacity = request.capacity,
			roomRate = request.roomRate,
			checkInTime = request.checkInTime,
			checkOutTime = request.checkOutTime,
		)
		return ApiResponse.success(RoomTypeHotelAdminResponse.from(roomType))
	}
}
