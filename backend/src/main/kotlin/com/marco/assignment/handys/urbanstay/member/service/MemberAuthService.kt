package com.marco.assignment.handys.urbanstay.member.service

import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.member.entity.Member
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.InternalAuthenticationServiceException
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class MemberAuthService(
	userDetailsService: MemberUserDetailsService,
	passwordEncoder: PasswordEncoder,
) {

	private val authenticationManager: AuthenticationManager =
		ProviderManager(DaoAuthenticationProvider(userDetailsService).apply { setPasswordEncoder(passwordEncoder) })

	fun authenticate(email: String, password: String): Authentication =
		try {
			authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(email, password))
		} catch (e: BadCredentialsException) {
			throw BusinessException(AccountErrorCode.INVALID_CREDENTIALS)
		} catch (e: InternalAuthenticationServiceException) {
			throw IllegalStateException("Member authentication failed", e)
		}

	fun authenticated(member: Member): Authentication {
		val principal = MemberPrincipal.from(member).apply { eraseCredentials() }
		return UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.authorities)
	}
}
