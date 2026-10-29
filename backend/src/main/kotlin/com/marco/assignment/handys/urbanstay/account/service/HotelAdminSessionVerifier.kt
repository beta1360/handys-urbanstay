package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.security.SessionAuthenticationVerifier
import org.slf4j.LoggerFactory
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Service

@Service
class HotelAdminSessionVerifier(
	private val hotelAdminRepository: HotelAdminRepository,
) : SessionAuthenticationVerifier {

	private val log = LoggerFactory.getLogger(javaClass)

	override fun isValid(authentication: Authentication): Boolean {
		val principal = authentication.principal as? HotelAdminPrincipal ?: return true
		val hotelAdmin = hotelAdminRepository.findByIdOrNull(principal.id)
		val valid = hotelAdmin != null && hotelAdmin.active && hotelAdmin.credentialVersion == principal.credentialVersion
		if (!valid) {
			log.info("Hotel admin session is no longer valid: hotelAdminId={}", principal.id)
		}
		return valid
	}
}
