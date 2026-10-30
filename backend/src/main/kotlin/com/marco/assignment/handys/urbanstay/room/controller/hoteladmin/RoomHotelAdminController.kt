package com.marco.assignment.handys.urbanstay.room.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringEditor
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomCreateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomHotelAdminResponse
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomStatusHistoryHotelAdminResponse
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomStatusUpdateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.room.dto.hoteladmin.RoomUpdateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.room.exception.RoomApiErrors
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.service.RoomService
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

@Tag(name = "room", description = "openapi.hotel-admin.tag.room")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + "/rooms")
class RoomHotelAdminController(
	private val roomService: RoomService,
) {

	@InitBinder
	fun trimRequestParameters(binder: WebDataBinder) {
		binder.registerCustomEditor(String::class.java, TrimmedStringEditor())
	}

	@Operation(summary = "openapi.hotel-admin.operation.createRoom.summary", description = "openapi.hotel-admin.operation.createRoom.description")
	@RoomApiErrors(RoomErrorCode.ROOM_DUPLICATED)
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun createRoom(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@Valid @RequestBody request: RoomCreateHotelAdminRequest,
	): ApiResponse<RoomHotelAdminResponse> {
		val room = roomService.create(
			hotelId = hotelAdmin.hotelId,
			hotelAdminId = hotelAdmin.id,
			name = request.name,
			type = request.type,
			capacity = request.capacity,
			floor = request.floor,
			description = request.description,
			checkInTime = request.checkInTime,
			checkOutTime = request.checkOutTime,
		)
		return ApiResponse.success(RoomHotelAdminResponse.from(room))
	}

	@Operation(summary = "openapi.hotel-admin.operation.getRooms.summary", description = "openapi.hotel-admin.operation.getRooms.description")
	@GetMapping
	fun getRooms(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@RequestParam(required = false)
		@Size(max = KEYWORD_MAX_LENGTH, message = "{validation.max-length}")
		@Parameter(description = "openapi.hotel-admin.operation.getRooms.parameter.keyword")
		keyword: String?,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getRooms.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getRooms.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<RoomHotelAdminResponse>> =
		ApiResponse.success(PageResponse.from(roomService.getRooms(hotelAdmin.hotelId, keyword, page, size).map(RoomHotelAdminResponse::from)))

	@Operation(summary = "openapi.hotel-admin.operation.getRoom.summary", description = "openapi.hotel-admin.operation.getRoom.description")
	@RoomApiErrors(RoomErrorCode.ROOM_NOT_FOUND)
	@GetMapping("/{roomId}")
	fun getRoom(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable roomId: Long,
	): ApiResponse<RoomHotelAdminResponse> =
		ApiResponse.success(RoomHotelAdminResponse.from(roomService.getRoom(hotelAdmin.hotelId, roomId)))

	@Operation(summary = "openapi.hotel-admin.operation.updateRoom.summary", description = "openapi.hotel-admin.operation.updateRoom.description")
	@RoomApiErrors(RoomErrorCode.ROOM_NOT_FOUND, RoomErrorCode.ROOM_DUPLICATED, RoomErrorCode.ROOM_MODIFIED)
	@PutMapping("/{roomId}")
	fun updateRoom(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable roomId: Long,
		@Valid @RequestBody request: RoomUpdateHotelAdminRequest,
	): ApiResponse<RoomHotelAdminResponse> {
		val room = roomService.update(
			hotelId = hotelAdmin.hotelId,
			roomId = roomId,
			version = request.version,
			name = request.name,
			type = request.type,
			capacity = request.capacity,
			floor = request.floor,
			description = request.description,
			checkInTime = request.checkInTime,
			checkOutTime = request.checkOutTime,
		)
		return ApiResponse.success(RoomHotelAdminResponse.from(room))
	}

	@Operation(summary = "openapi.hotel-admin.operation.updateRoomStatus.summary", description = "openapi.hotel-admin.operation.updateRoomStatus.description")
	@RoomApiErrors(RoomErrorCode.ROOM_NOT_FOUND, RoomErrorCode.ROOM_STATUS_TRANSITION_NOT_ALLOWED, RoomErrorCode.ROOM_STATUS_CHANGED)
	@PutMapping("/{roomId}/status")
	fun updateRoomStatus(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable roomId: Long,
		@Valid @RequestBody request: RoomStatusUpdateHotelAdminRequest,
	): ApiResponse<RoomHotelAdminResponse> {
		val room = roomService.changeStatus(
			hotelId = hotelAdmin.hotelId,
			roomId = roomId,
			hotelAdminId = hotelAdmin.id,
			from = request.from,
			to = request.to,
		)
		return ApiResponse.success(RoomHotelAdminResponse.from(room))
	}

	@Operation(
		summary = "openapi.hotel-admin.operation.getRoomStatusHistories.summary",
		description = "openapi.hotel-admin.operation.getRoomStatusHistories.description",
	)
	@RoomApiErrors(RoomErrorCode.ROOM_NOT_FOUND)
	@GetMapping("/{roomId}/status-histories")
	fun getRoomStatusHistories(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@PathVariable roomId: Long,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getRoomStatusHistories.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getRoomStatusHistories.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<RoomStatusHistoryHotelAdminResponse>> =
		ApiResponse.success(
			PageResponse.from(roomService.getStatusHistories(hotelAdmin.hotelId, roomId, page, size).map(RoomStatusHistoryHotelAdminResponse::from)),
		)

	companion object {
		const val KEYWORD_MAX_LENGTH = 100
	}
}
