package com.marco.assignment.handys.urbanstay.member.controller.appadmin

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.request.PageParams
import com.marco.assignment.handys.urbanstay.common.request.TrimmedStringEditor
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.PageResponse
import com.marco.assignment.handys.urbanstay.member.dto.appadmin.MemberAppAdminResponse
import com.marco.assignment.handys.urbanstay.member.exception.MemberApiErrors
import com.marco.assignment.handys.urbanstay.member.exception.MemberErrorCode
import com.marco.assignment.handys.urbanstay.member.service.MemberService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import org.springframework.web.bind.WebDataBinder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.InitBinder
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "member", description = "openapi.app-admin.tag.member")
@RestController
@RequestMapping(ApiPaths.APP_ADMIN + "/members")
class MemberAppAdminController(
	private val memberService: MemberService,
) {

	@InitBinder
	fun trimRequestParameters(binder: WebDataBinder) {
		binder.registerCustomEditor(String::class.java, TrimmedStringEditor())
	}

	@Operation(summary = "openapi.app-admin.operation.getMembers.summary", description = "openapi.app-admin.operation.getMembers.description")
	@GetMapping
	fun getMembers(
		@RequestParam(required = false)
		@Size(max = KEYWORD_MAX_LENGTH, message = "{validation.max-length}")
		@Parameter(description = "openapi.app-admin.operation.getMembers.parameter.keyword")
		keyword: String?,
		@RequestParam(defaultValue = PageParams.DEFAULT_PAGE)
		@Min(value = PageParams.MIN_PAGE, message = "{validation.min}")
		@Max(value = PageParams.MAX_PAGE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getMembers.parameter.page")
		page: Int,
		@RequestParam(defaultValue = PageParams.DEFAULT_SIZE)
		@Min(value = PageParams.MIN_SIZE, message = "{validation.min}")
		@Max(value = PageParams.MAX_SIZE, message = "{validation.max}")
		@Parameter(description = "openapi.app-admin.operation.getMembers.parameter.size")
		size: Int,
	): ApiResponse<PageResponse<MemberAppAdminResponse>> =
		ApiResponse.success(PageResponse.from(memberService.getMembers(keyword, page, size).map(MemberAppAdminResponse::from)))

	@Operation(summary = "openapi.app-admin.operation.getMember.summary", description = "openapi.app-admin.operation.getMember.description")
	@MemberApiErrors(MemberErrorCode.MEMBER_NOT_FOUND)
	@GetMapping("/{memberId}")
	fun getMember(@PathVariable memberId: Long): ApiResponse<MemberAppAdminResponse> =
		ApiResponse.success(MemberAppAdminResponse.from(memberService.getMember(memberId)))

	companion object {
		const val KEYWORD_MAX_LENGTH = 100
	}
}
