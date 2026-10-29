package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.common.security.Role
import org.springframework.security.core.CredentialsContainer
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

class HotelAdminPrincipal(
	val id: Long,
	val hotelId: Long,
	val credentialVersion: Long,
	private val loginId: String,
	private var passwordHash: String?,
	private val authorities: List<GrantedAuthority>,
) : UserDetails, CredentialsContainer {

	override fun getUsername(): String = loginId

	override fun getPassword(): String? = passwordHash

	override fun getAuthorities(): Collection<GrantedAuthority> = authorities

	override fun eraseCredentials() {
		passwordHash = null
	}

	companion object {
		private const val ROLE_PREFIX = "ROLE_"

		fun from(hotelAdmin: HotelAdmin): HotelAdminPrincipal =
			HotelAdminPrincipal(
				id = checkNotNull(hotelAdmin.id),
				hotelId = checkNotNull(hotelAdmin.hotel.id),
				credentialVersion = hotelAdmin.credentialVersion,
				loginId = hotelAdmin.loginId,
				passwordHash = hotelAdmin.passwordHash,
				authorities = roles(hotelAdmin.role).map { SimpleGrantedAuthority(ROLE_PREFIX + it.name) },
			)

		private fun roles(role: HotelAdminRole): List<Role> =
			when (role) {
				HotelAdminRole.MASTER -> listOf(Role.HOTEL_ADMIN, Role.HOTEL_MASTER)
				HotelAdminRole.OPERATOR -> listOf(Role.HOTEL_ADMIN)
			}
	}
}
