package com.marco.assignment.handys.urbanstay.account.controller.appadmin

import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountAdminAppAdminResponse
import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountAdminCreateAppAdminRequest
import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountAdminDetailAppAdminResponse
import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountAdminUpdateAppAdminRequest
import com.marco.assignment.handys.urbanstay.account.exception.AccountApiErrors
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.service.AppAdminService
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(name = "account", description = "openapi.app-admin.tag.account")
@RestController
@RequestMapping(ApiPaths.APP_ADMIN + ApiPaths.ADMINS)
class AccountAdminAppAdminController(
	private val appAdminService: AppAdminService,
) {

	@Operation(summary = "openapi.app-admin.operation.getAdmins.summary", description = "openapi.app-admin.operation.getAdmins.description")
	@GetMapping
	fun getAdmins(
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getAdmins.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getAdmins.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<AccountAdminAppAdminResponse>> =
		ApiResponse.success(PageResponse.from(appAdminService.getAdmins(page, size).map(AccountAdminAppAdminResponse::from)))

	@Operation(summary = "openapi.app-admin.operation.getAdmin.summary", description = "openapi.app-admin.operation.getAdmin.description")
	@AccountApiErrors(AccountErrorCode.APP_ADMIN_NOT_FOUND)
	@GetMapping("/{adminId}")
	fun getAdmin(@PathVariable adminId: Long): ApiResponse<AccountAdminDetailAppAdminResponse> =
		ApiResponse.success(AccountAdminDetailAppAdminResponse.from(appAdminService.getAdmin(adminId)))

	@Operation(summary = "openapi.app-admin.operation.createAdmin.summary", description = "openapi.app-admin.operation.createAdmin.description")
	@AccountApiErrors(AccountErrorCode.LOGIN_ID_DUPLICATED)
	@SuccessMessage("success.app-admin.created")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun createAdmin(@Valid @RequestBody request: AccountAdminCreateAppAdminRequest): ApiResponse<AccountAdminDetailAppAdminResponse> {
		val admin = appAdminService.create(request.loginId, request.name, request.password)
		return ApiResponse.success(AccountAdminDetailAppAdminResponse.from(admin))
	}

	@Operation(summary = "openapi.app-admin.operation.updateAdmin.summary", description = "openapi.app-admin.operation.updateAdmin.description")
	@AccountApiErrors(AccountErrorCode.APP_ADMIN_NOT_FOUND, AccountErrorCode.APP_ADMIN_MODIFIED)
	@SuccessMessage("success.app-admin.updated")
	@PutMapping("/{adminId}")
	fun updateAdmin(
		@PathVariable adminId: Long,
		@Valid @RequestBody request: AccountAdminUpdateAppAdminRequest,
	): ApiResponse<AccountAdminDetailAppAdminResponse> {
		val admin = appAdminService.update(adminId, request.version, request.name)
		return ApiResponse.success(AccountAdminDetailAppAdminResponse.from(admin))
	}
}
