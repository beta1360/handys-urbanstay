package com.marco.assignment.handys.urbanstay.account.repository

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import org.springframework.data.jpa.repository.JpaRepository

interface AppAdminRepository : JpaRepository<AppAdmin, Long> {

	fun findByLoginId(loginId: String): AppAdmin?
}
