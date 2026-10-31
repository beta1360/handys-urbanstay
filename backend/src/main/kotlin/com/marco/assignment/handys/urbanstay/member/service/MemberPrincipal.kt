package com.marco.assignment.handys.urbanstay.member.service

import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.member.entity.Member
import org.springframework.security.core.CredentialsContainer
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

class MemberPrincipal(
	val id: Long,
	private val email: String,
	private var passwordHash: String?,
) : UserDetails, CredentialsContainer {

	override fun getUsername(): String = email

	override fun getPassword(): String? = passwordHash

	override fun getAuthorities(): Collection<GrantedAuthority> = AUTHORITIES

	override fun eraseCredentials() {
		passwordHash = null
	}

	companion object {
		private val AUTHORITIES = listOf(SimpleGrantedAuthority("ROLE_" + Role.MEMBER.name))

		fun from(member: Member): MemberPrincipal = MemberPrincipal(checkNotNull(member.id), member.email, member.passwordHash)
	}
}
