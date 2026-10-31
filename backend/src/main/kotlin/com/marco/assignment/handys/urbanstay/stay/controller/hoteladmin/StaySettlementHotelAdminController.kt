package com.marco.assignment.handys.urbanstay.stay.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin.StaySettlementHotelAdminResponse
import com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin.StaySettlementStayHotelAdminResponse
import com.marco.assignment.handys.urbanstay.stay.service.StaySettlementService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.YearMonth

@Tag(name = "stay", description = "openapi.hotel-admin.tag.stay")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + ApiPaths.SETTLEMENTS)
class StaySettlementHotelAdminController(
	private val staySettlementService: StaySettlementService,
) {

	@Operation(summary = "openapi.hotel-admin.operation.getSettlement.summary", description = "openapi.hotel-admin.operation.getSettlement.description")
	@GetMapping
	fun getSettlement(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@RequestParam
		@Parameter(
			description = "openapi.hotel-admin.operation.getSettlement.parameter.month",
			schema = Schema(type = "string", example = "2026-11", pattern = StaySettlementHotelAdminResponse.MONTH_PATTERN),
		)
		month: YearMonth,
	): ApiResponse<StaySettlementHotelAdminResponse> =
		ApiResponse.success(StaySettlementHotelAdminResponse.of(month, staySettlementService.getSettlement(hotelAdmin.hotelId, month)))

	@Operation(summary = "openapi.hotel-admin.operation.getSettlementStays.summary", description = "openapi.hotel-admin.operation.getSettlementStays.description")
	@GetMapping("/stays")
	fun getSettlementStays(
		@AuthenticationPrincipal hotelAdmin: HotelAdminPrincipal,
		@RequestParam
		@Parameter(
			description = "openapi.hotel-admin.operation.getSettlementStays.parameter.month",
			schema = Schema(type = "string", example = "2026-11", pattern = StaySettlementHotelAdminResponse.MONTH_PATTERN),
		)
		month: YearMonth,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getSettlementStays.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getSettlementStays.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<StaySettlementStayHotelAdminResponse>> =
		ApiResponse.success(
			PageResponse.from(staySettlementService.getSettlementStays(hotelAdmin.hotelId, month, page, size).map(StaySettlementStayHotelAdminResponse::from)),
		)
}
