package com.marco.assignment.handys.urbanstay.common.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.logout.CompositeLogoutHandler
import org.springframework.security.web.authentication.logout.CookieClearingLogoutHandler
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy
import org.springframework.security.web.context.SecurityContextRepository
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy
import org.springframework.security.web.csrf.CsrfLogoutHandler
import org.springframework.security.web.csrf.CsrfTokenRepository
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler

class LoginSessionHandler(
	csrfTokenRepository: CsrfTokenRepository?,
	private val securityContextRepository: SecurityContextRepository,
	sessionCookieName: String,
) {

	private val securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy()

	private val sessionAuthenticationStrategy = CompositeSessionAuthenticationStrategy(
		listOfNotNull(
			ChangeSessionIdAuthenticationStrategy(),
			csrfTokenRepository?.let { CsrfAuthenticationStrategy(it).apply { setRequestHandler(eagerCsrfTokenRequestHandler()) } },
		),
	)

	private val logoutHandler = CompositeLogoutHandler(
		listOfNotNull(
			csrfTokenRepository?.let(::CsrfLogoutHandler),
			CookieClearingLogoutHandler(sessionCookieName),
			SecurityContextLogoutHandler().apply { setSecurityContextRepository(securityContextRepository) },
		),
	)

	fun login(authentication: Authentication, request: HttpServletRequest, response: HttpServletResponse) {
		sessionAuthenticationStrategy.onAuthentication(authentication, request, response)
		val context = securityContextHolderStrategy.createEmptyContext()
		context.authentication = authentication
		securityContextHolderStrategy.context = context
		securityContextRepository.saveContext(context, request, response)
	}

	fun logout(request: HttpServletRequest, response: HttpServletResponse) {
		logoutHandler.logout(request, response, securityContextHolderStrategy.context.authentication)
	}

	// 속성 이름을 null로 두면 토큰을 바로 읽어서,
	// 로그인 응답에 새 XSRF-TOKEN 쿠키가 실린다.
	private fun eagerCsrfTokenRequestHandler(): XorCsrfTokenRequestAttributeHandler =
		XorCsrfTokenRequestAttributeHandler().apply { setCsrfRequestAttributeName(null) }
}
