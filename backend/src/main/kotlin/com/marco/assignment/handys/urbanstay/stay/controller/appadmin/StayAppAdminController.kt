package com.marco.assignment.handys.urbanstay.stay.controller.appadmin

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.member.exception.MemberApiErrors
import com.marco.assignment.handys.urbanstay.member.exception.MemberErrorCode
import com.marco.assignment.handys.urbanstay.stay.dto.appadmin.StayAppAdminResponse
import com.marco.assignment.handys.urbanstay.stay.service.StayService
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

@Tag(name = "stay", description = "openapi.app-admin.tag.stay")
@RestController
@RequestMapping(ApiPaths.APP_ADMIN)
class StayAppAdminController(
	private val stayService: StayService,
) {

	@Operation(summary = "openapi.app-admin.operation.getMemberStays.summary", description = "openapi.app-admin.operation.getMemberStays.description")
	@MemberApiErrors(MemberErrorCode.MEMBER_NOT_FOUND)
	@GetMapping("/members/{memberId}/stays")
	fun getMemberStays(
		@PathVariable memberId: Long,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getMemberStays.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getMemberStays.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<StayAppAdminResponse>> =
		ApiResponse.success(PageResponse.from(stayService.getMemberStays(memberId, page, size).map(StayAppAdminResponse::from)))
}
