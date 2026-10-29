package com.marco.assignment.handys.urbanstay.account.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.dto.hoteladmin.AccountHotelOperatorCreateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.account.dto.hoteladmin.AccountHotelOperatorHotelAdminResponse
import com.marco.assignment.handys.urbanstay.account.dto.hoteladmin.AccountHotelOperatorPasswordResetHotelAdminRequest
import com.marco.assignment.handys.urbanstay.account.dto.hoteladmin.AccountHotelOperatorUpdateHotelAdminRequest
import com.marco.assignment.handys.urbanstay.account.exception.AccountApiErrors
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.account.service.HotelOperatorService
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringEditor
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
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

@Tag(name = "account", description = "openapi.hotel-admin.tag.account")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + ApiPaths.OPERATORS)
class AccountHotelOperatorHotelAdminController(
	private val hotelOperatorService: HotelOperatorService,
) {

	@InitBinder
	fun trimRequestParameters(binder: WebDataBinder) {
		binder.registerCustomEditor(String::class.java, TrimmedStringEditor())
	}

	@Operation(summary = "openapi.hotel-admin.operation.createHotelOperator.summary", description = "openapi.hotel-admin.operation.createHotelOperator.description")
	@AccountApiErrors(AccountErrorCode.LOGIN_ID_DUPLICATED)
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun createHotelOperator(
		@AuthenticationPrincipal master: HotelAdminPrincipal,
		@Valid @RequestBody request: AccountHotelOperatorCreateHotelAdminRequest,
	): ApiResponse<AccountHotelOperatorHotelAdminResponse> {
		val operator = hotelOperatorService.create(master.hotelId, request.loginId, request.name, request.password)
		return ApiResponse.success(AccountHotelOperatorHotelAdminResponse.from(operator))
	}

	@Operation(summary = "openapi.hotel-admin.operation.getHotelOperators.summary", description = "openapi.hotel-admin.operation.getHotelOperators.description")
	@GetMapping
	fun getHotelOperators(
		@AuthenticationPrincipal master: HotelAdminPrincipal,
		@RequestParam(required = false)
		@Size(max = KEYWORD_MAX_LENGTH, message = "{validation.max-length}")
		@Parameter(description = "openapi.hotel-admin.operation.getHotelOperators.parameter.keyword")
		keyword: String?,
		@RequestParam(required = false)
		@Parameter(description = "openapi.hotel-admin.operation.getHotelOperators.parameter.active")
		active: Boolean?,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getHotelOperators.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.hotel-admin.operation.getHotelOperators.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<AccountHotelOperatorHotelAdminResponse>> {
		val operators = hotelOperatorService.getOperators(master.hotelId, keyword, active, page, size)
		return ApiResponse.success(PageResponse.from(operators.map(AccountHotelOperatorHotelAdminResponse::from)))
	}

	@Operation(summary = "openapi.hotel-admin.operation.getHotelOperator.summary", description = "openapi.hotel-admin.operation.getHotelOperator.description")
	@AccountApiErrors(AccountErrorCode.HOTEL_OPERATOR_NOT_FOUND)
	@GetMapping("/{operatorId}")
	fun getHotelOperator(
		@AuthenticationPrincipal master: HotelAdminPrincipal,
		@PathVariable operatorId: Long,
	): ApiResponse<AccountHotelOperatorHotelAdminResponse> =
		ApiResponse.success(AccountHotelOperatorHotelAdminResponse.from(hotelOperatorService.getOperator(master.hotelId, operatorId)))

	@Operation(summary = "openapi.hotel-admin.operation.updateHotelOperator.summary", description = "openapi.hotel-admin.operation.updateHotelOperator.description")
	@AccountApiErrors(AccountErrorCode.HOTEL_OPERATOR_NOT_FOUND, AccountErrorCode.LOGIN_ID_DUPLICATED, AccountErrorCode.HOTEL_ADMIN_MODIFIED)
	@PutMapping("/{operatorId}")
	fun updateHotelOperator(
		@AuthenticationPrincipal master: HotelAdminPrincipal,
		@PathVariable operatorId: Long,
		@Valid @RequestBody request: AccountHotelOperatorUpdateHotelAdminRequest,
	): ApiResponse<AccountHotelOperatorHotelAdminResponse> {
		val operator = hotelOperatorService.update(master.hotelId, operatorId, request.version, request.loginId, request.name)
		return ApiResponse.success(AccountHotelOperatorHotelAdminResponse.from(operator))
	}

	@Operation(
		summary = "openapi.hotel-admin.operation.resetHotelOperatorPassword.summary",
		description = "openapi.hotel-admin.operation.resetHotelOperatorPassword.description",
	)
	@AccountApiErrors(AccountErrorCode.HOTEL_OPERATOR_NOT_FOUND, AccountErrorCode.HOTEL_ADMIN_MODIFIED)
	@PutMapping("/{operatorId}/password")
	fun resetHotelOperatorPassword(
		@AuthenticationPrincipal master: HotelAdminPrincipal,
		@PathVariable operatorId: Long,
		@Valid @RequestBody request: AccountHotelOperatorPasswordResetHotelAdminRequest,
	): ApiResponse<Nothing?> {
		hotelOperatorService.resetPassword(master.hotelId, operatorId, request.password)
		return ApiResponse.success(null)
	}

	companion object {
		const val KEYWORD_MAX_LENGTH = 100
	}
}
