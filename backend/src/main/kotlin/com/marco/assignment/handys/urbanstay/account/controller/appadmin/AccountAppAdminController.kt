package com.marco.assignment.handys.urbanstay.account.controller.appadmin

import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountAppAdminResponse
import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountLoginAppAdminRequest
import com.marco.assignment.handys.urbanstay.account.exception.AccountApiErrors
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.service.AppAdminAuthService
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
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

@Tag(name = "account", description = "openapi.app-admin.tag.account")
@RestController
@RequestMapping(ApiPaths.APP_ADMIN + ApiPaths.AUTH)
class AccountAppAdminController(
	private val appAdminAuthService: AppAdminAuthService,
	private val loginSessionHandler: LoginSessionHandler,
) {

	@Operation(summary = "openapi.app-admin.operation.login.summary", description = "openapi.app-admin.operation.login.description")
	@AccountApiErrors(AccountErrorCode.INVALID_CREDENTIALS)
	@PostMapping(ApiPaths.LOGIN)
	fun login(
		@Valid @RequestBody request: AccountLoginAppAdminRequest,
		httpRequest: HttpServletRequest,
		httpResponse: HttpServletResponse,
	): ApiResponse<AccountAppAdminResponse> {
		val authentication = appAdminAuthService.authenticate(request.loginId, request.password)
		val admin = appAdminAuthService.getAppAdmin(authentication.name)
		loginSessionHandler.login(authentication, httpRequest, httpResponse)
		return ApiResponse.success(AccountAppAdminResponse.from(admin))
	}

	@Operation(summary = "openapi.app-admin.operation.logout.summary", description = "openapi.app-admin.operation.logout.description")
	@PostMapping("/logout")
	fun logout(httpRequest: HttpServletRequest, httpResponse: HttpServletResponse): ApiResponse<Nothing?> {
		loginSessionHandler.logout(httpRequest, httpResponse)
		return ApiResponse.success(null)
	}

	@Operation(summary = "openapi.app-admin.operation.getMe.summary", description = "openapi.app-admin.operation.getMe.description")
	@GetMapping("/me")
	fun getMe(authentication: Authentication): ApiResponse<AccountAppAdminResponse> =
		ApiResponse.success(AccountAppAdminResponse.from(appAdminAuthService.getAppAdmin(authentication.name)))
}
