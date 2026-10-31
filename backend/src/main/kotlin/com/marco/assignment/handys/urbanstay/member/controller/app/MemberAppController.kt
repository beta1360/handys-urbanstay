package com.marco.assignment.handys.urbanstay.member.controller.app

import com.marco.assignment.handys.urbanstay.account.exception.AccountApiErrors
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.config.SecurityConfig
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.response.SuccessMessage
import com.marco.assignment.handys.urbanstay.common.security.LoginSessionHandler
import com.marco.assignment.handys.urbanstay.member.dto.app.MemberAppResponse
import com.marco.assignment.handys.urbanstay.member.dto.app.MemberLoginAppRequest
import com.marco.assignment.handys.urbanstay.member.dto.app.MemberSignupAppRequest
import com.marco.assignment.handys.urbanstay.member.exception.MemberApiErrors
import com.marco.assignment.handys.urbanstay.member.exception.MemberErrorCode
import com.marco.assignment.handys.urbanstay.member.service.MemberAuthService
import com.marco.assignment.handys.urbanstay.member.service.MemberPrincipal
import com.marco.assignment.handys.urbanstay.member.service.MemberService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(name = "member", description = "openapi.app.tag.member")
@RestController
@RequestMapping(ApiPaths.APP + ApiPaths.AUTH)
class MemberAppController(
	private val memberService: MemberService,
	private val memberAuthService: MemberAuthService,
	@Qualifier(SecurityConfig.MEMBER_LOGIN_SESSION_HANDLER) private val loginSessionHandler: LoginSessionHandler,
) {

	@Operation(summary = "openapi.app.operation.signup.summary", description = "openapi.app.operation.signup.description")
	@MemberApiErrors(MemberErrorCode.MEMBER_EMAIL_DUPLICATED)
	@SuccessMessage("success.member.signed-up")
	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	fun signup(
		@Valid @RequestBody request: MemberSignupAppRequest,
		httpRequest: HttpServletRequest,
		httpResponse: HttpServletResponse,
	): ApiResponse<MemberAppResponse> {
		val member = memberService.signup(request.email, request.password, request.name, request.phone)
		loginSessionHandler.login(memberAuthService.authenticated(member), httpRequest, httpResponse)
		return ApiResponse.success(MemberAppResponse.from(member))
	}

	@Operation(summary = "openapi.app.operation.login.summary", description = "openapi.app.operation.login.description")
	@AccountApiErrors(AccountErrorCode.INVALID_CREDENTIALS)
	@SuccessMessage("success.auth.login")
	@PostMapping(ApiPaths.LOGIN)
	fun login(
		@Valid @RequestBody request: MemberLoginAppRequest,
		httpRequest: HttpServletRequest,
		httpResponse: HttpServletResponse,
	): ApiResponse<MemberAppResponse> {
		val authentication = memberAuthService.authenticate(request.email, request.password)
		val member = memberService.getMember((authentication.principal as MemberPrincipal).id)
		loginSessionHandler.login(authentication, httpRequest, httpResponse)
		return ApiResponse.success(MemberAppResponse.from(member))
	}

	@Operation(summary = "openapi.app.operation.logout.summary", description = "openapi.app.operation.logout.description")
	@SuccessMessage("success.auth.logout")
	@PostMapping("/logout")
	fun logout(httpRequest: HttpServletRequest, httpResponse: HttpServletResponse): ApiResponse<Nothing?> {
		loginSessionHandler.logout(httpRequest, httpResponse)
		return ApiResponse.success(null)
	}

	@Operation(summary = "openapi.app.operation.getMe.summary", description = "openapi.app.operation.getMe.description")
	@GetMapping("/me")
	fun getMe(@AuthenticationPrincipal principal: MemberPrincipal): ApiResponse<MemberAppResponse> =
		ApiResponse.success(MemberAppResponse.from(memberService.getMember(principal.id)))
}
