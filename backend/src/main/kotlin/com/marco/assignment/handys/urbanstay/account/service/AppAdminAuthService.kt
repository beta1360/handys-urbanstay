package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.InternalAuthenticationServiceException
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AppAdminAuthService(
	userDetailsService: AppAdminUserDetailsService,
	passwordEncoder: PasswordEncoder,
	private val appAdminRepository: AppAdminRepository,
) {

	private val authenticationManager: AuthenticationManager =
		ProviderManager(DaoAuthenticationProvider(userDetailsService).apply { setPasswordEncoder(passwordEncoder) })

	fun authenticate(loginId: String, password: String): Authentication =
		try {
			authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(loginId, password))
		} catch (e: BadCredentialsException) {
			throw BusinessException(AccountErrorCode.INVALID_CREDENTIALS)
		} catch (e: InternalAuthenticationServiceException) {
			throw IllegalStateException("App admin authentication failed", e)
		}

	@Transactional(readOnly = true)
	fun getAppAdmin(loginId: String): AppAdmin =
		appAdminRepository.findByLoginId(loginId) ?: throw BusinessException(CommonErrorCode.UNAUTHORIZED)
}
