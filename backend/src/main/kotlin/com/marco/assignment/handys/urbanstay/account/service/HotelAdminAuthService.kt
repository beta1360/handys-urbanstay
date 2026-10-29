package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
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
class HotelAdminAuthService(
	userDetailsService: HotelAdminUserDetailsService,
	passwordEncoder: PasswordEncoder,
	private val hotelAdminRepository: HotelAdminRepository,
) {

	private val authenticationManager: AuthenticationManager =
		ProviderManager(DaoAuthenticationProvider(userDetailsService).apply { setPasswordEncoder(passwordEncoder) })

	fun authenticate(loginId: String, password: String): Authentication =
		try {
			authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(loginId, password))
		} catch (e: BadCredentialsException) {
			throw BusinessException(AccountErrorCode.INVALID_CREDENTIALS)
		} catch (e: InternalAuthenticationServiceException) {
			throw IllegalStateException("Hotel admin authentication failed", e)
		}

	@Transactional(readOnly = true)
	fun getHotelAdmin(authentication: Authentication): HotelAdmin {
		val principal = authentication.principal as? HotelAdminPrincipal ?: throw BusinessException(CommonErrorCode.UNAUTHORIZED)
		return hotelAdminRepository.findWithHotelById(principal.id) ?: throw BusinessException(CommonErrorCode.UNAUTHORIZED)
	}
}
