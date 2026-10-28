package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.common.security.Role
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class AppAdminUserDetailsService(
	private val appAdminRepository: AppAdminRepository,
) : UserDetailsService {

	override fun loadUserByUsername(username: String): UserDetails {
		val admin = appAdminRepository.findByLoginId(LoginId.normalize(username))
			?: throw UsernameNotFoundException("App admin not found")
		return User.withUsername(admin.loginId)
			.password(admin.passwordHash)
			.roles(Role.APP_ADMIN.name)
			.build()
	}
}
