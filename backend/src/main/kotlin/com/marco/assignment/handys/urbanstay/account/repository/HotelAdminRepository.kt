package com.marco.assignment.handys.urbanstay.account.repository

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import org.springframework.data.jpa.repository.JpaRepository

interface HotelAdminRepository : JpaRepository<HotelAdmin, Long> {

	fun existsByLoginId(loginId: String): Boolean
}
