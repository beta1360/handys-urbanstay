package com.marco.assignment.handys.urbanstay.member.service

import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.member.repository.MemberRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberUserDetailsService(
	private val memberRepository: MemberRepository,
) : UserDetailsService {

	@Transactional(readOnly = true)
	override fun loadUserByUsername(username: String): UserDetails {
		val member = memberRepository.findByEmail(LoginId.normalize(username)) ?: throw UsernameNotFoundException("Member not found")
		return MemberPrincipal.from(member)
	}
}
