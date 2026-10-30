package com.marco.assignment.handys.urbanstay.account.controller.appadmin

import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountHotelMasterAppAdminResponse
import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountHotelMasterPasswordResetAppAdminRequest
import com.marco.assignment.handys.urbanstay.account.dto.appadmin.AccountHotelMasterUpdateAppAdminRequest
import com.marco.assignment.handys.urbanstay.account.exception.AccountApiErrors
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.service.HotelMasterService
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelApiErrors
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "account", description = "openapi.app-admin.tag.account")
@RestController
@RequestMapping(ApiPaths.APP_ADMIN + "/hotels/{hotelId}/master")
class AccountHotelMasterAppAdminController(
	private val hotelMasterService: HotelMasterService,
) {

	@Operation(summary = "openapi.app-admin.operation.getHotelMaster.summary", description = "openapi.app-admin.operation.getHotelMaster.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND)
	@AccountApiErrors(AccountErrorCode.HOTEL_MASTER_NOT_FOUND)
	@GetMapping
	fun getHotelMaster(@PathVariable hotelId: Long): ApiResponse<AccountHotelMasterAppAdminResponse> =
		ApiResponse.success(AccountHotelMasterAppAdminResponse.from(hotelMasterService.getMaster(hotelId)))

	@Operation(summary = "openapi.app-admin.operation.updateHotelMaster.summary", description = "openapi.app-admin.operation.updateHotelMaster.description")
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND)
	@AccountApiErrors(AccountErrorCode.HOTEL_MASTER_NOT_FOUND, AccountErrorCode.LOGIN_ID_DUPLICATED, AccountErrorCode.HOTEL_ADMIN_MODIFIED)
	@SuccessMessage("success.hotel-master.updated")
	@PutMapping
	fun updateHotelMaster(
		@PathVariable hotelId: Long,
		@Valid @RequestBody request: AccountHotelMasterUpdateAppAdminRequest,
	): ApiResponse<AccountHotelMasterAppAdminResponse> {
		val master = hotelMasterService.update(hotelId, request.version, request.loginId, request.name)
		return ApiResponse.success(AccountHotelMasterAppAdminResponse.from(master))
	}

	@Operation(
		summary = "openapi.app-admin.operation.resetHotelMasterPassword.summary",
		description = "openapi.app-admin.operation.resetHotelMasterPassword.description",
	)
	@HotelApiErrors(HotelErrorCode.HOTEL_NOT_FOUND)
	@AccountApiErrors(AccountErrorCode.HOTEL_MASTER_NOT_FOUND, AccountErrorCode.HOTEL_ADMIN_MODIFIED)
	@SuccessMessage("success.password.reset")
	@PutMapping("/password")
	fun resetHotelMasterPassword(
		@PathVariable hotelId: Long,
		@Valid @RequestBody request: AccountHotelMasterPasswordResetAppAdminRequest,
	): ApiResponse<Nothing?> {
		hotelMasterService.resetPassword(hotelId, request.password)
		return ApiResponse.success(null)
	}
}
