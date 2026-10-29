package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class HotelAdminUserDetailsService(
	private val hotelAdminRepository: HotelAdminRepository,
) : UserDetailsService {

	@Transactional(readOnly = true)
	override fun loadUserByUsername(username: String): UserDetails {
		val hotelAdmin = hotelAdminRepository.findByLoginIdAndActiveTrue(LoginId.normalize(username))
			?: throw UsernameNotFoundException("Active hotel admin not found")
		return HotelAdminPrincipal.from(hotelAdmin)
	}
}
