package com.marco.assignment.handys.urbanstay.account.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.account.dto.hoteladmin.AccountHotelAdminResponse
import com.marco.assignment.handys.urbanstay.account.dto.hoteladmin.AccountLoginHotelAdminRequest
import com.marco.assignment.handys.urbanstay.account.exception.AccountApiErrors
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminAuthService
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.common.security.LoginSessionHandler
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "account", description = "openapi.hotel-admin.tag.account")
@RestController
@RequestMapping(ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH)
class AccountHotelAdminController(
	private val hotelAdminAuthService: HotelAdminAuthService,
	private val loginSessionHandler: LoginSessionHandler,
) {

	@Operation(summary = "openapi.hotel-admin.operation.login.summary", description = "openapi.hotel-admin.operation.login.description")
	@AccountApiErrors(AccountErrorCode.INVALID_CREDENTIALS)
	@SuccessMessage("success.auth.login")
	@PostMapping(ApiPaths.LOGIN)
	fun login(
		@Valid @RequestBody request: AccountLoginHotelAdminRequest,
		httpRequest: HttpServletRequest,
		httpResponse: HttpServletResponse,
	): ApiResponse<AccountHotelAdminResponse> {
		val authentication = hotelAdminAuthService.authenticate(request.loginId, request.password)
		val hotelAdmin = hotelAdminAuthService.getHotelAdmin(authentication)
		loginSessionHandler.login(authentication, httpRequest, httpResponse)
		return ApiResponse.success(AccountHotelAdminResponse.from(hotelAdmin))
	}

	@Operation(summary = "openapi.hotel-admin.operation.logout.summary", description = "openapi.hotel-admin.operation.logout.description")
	@SuccessMessage("success.auth.logout")
	@PostMapping("/logout")
	fun logout(httpRequest: HttpServletRequest, httpResponse: HttpServletResponse): ApiResponse<Nothing?> {
		loginSessionHandler.logout(httpRequest, httpResponse)
		return ApiResponse.success(null)
	}

	@Operation(summary = "openapi.hotel-admin.operation.getMe.summary", description = "openapi.hotel-admin.operation.getMe.description")
	@GetMapping("/me")
	fun getMe(authentication: Authentication): ApiResponse<AccountHotelAdminResponse> =
		ApiResponse.success(AccountHotelAdminResponse.from(hotelAdminAuthService.getHotelAdmin(authentication)))
}
