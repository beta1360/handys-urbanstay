package com.marco.assignment.handys.urbanstay.member.service

import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.member.entity.Member
import com.marco.assignment.handys.urbanstay.member.exception.MemberErrorCode
import com.marco.assignment.handys.urbanstay.member.repository.MemberRepository
import com.marco.assignment.handys.urbanstay.member.repository.MemberSpecifications
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberService(
	private val memberRepository: MemberRepository,
	private val passwordEncoder: PasswordEncoder,
) {

	@Transactional
	fun signup(email: String, password: String, name: String, phone: String): Member {
		if (memberRepository.existsByEmail(LoginId.normalize(email))) {
			throw BusinessException(MemberErrorCode.MEMBER_EMAIL_DUPLICATED)
		}
		return try {
			memberRepository.saveAndFlush(Member(email, checkNotNull(passwordEncoder.encode(password)), name, phone))
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(Member.EMAIL_UNIQUE_CONSTRAINT)) BusinessException(MemberErrorCode.MEMBER_EMAIL_DUPLICATED) else e
		}
	}

	@Transactional(readOnly = true)
	fun getMember(memberId: Long): Member =
		memberRepository.findByIdOrNull(memberId) ?: throw BusinessException(MemberErrorCode.MEMBER_NOT_FOUND)

	@Transactional(readOnly = true)
	fun getMembers(keyword: String?, page: Int, size: Int): Page<Member> =
		memberRepository.findAll(MemberSpecifications.search(keyword?.trim()?.ifEmpty { null }), PageRequest.of(page, size, NEWEST_FIRST))

	companion object {
		private val NEWEST_FIRST = Sort.by(Sort.Direction.DESC, Member::id.name)
	}
}
