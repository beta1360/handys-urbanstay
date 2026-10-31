package com.marco.assignment.handys.urbanstay.member.repository

import com.marco.assignment.handys.urbanstay.member.entity.Member
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor

interface MemberRepository : JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {

	fun findByEmail(email: String): Member?

	fun existsByEmail(email: String): Boolean
}
