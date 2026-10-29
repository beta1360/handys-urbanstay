package com.marco.assignment.handys.urbanstay.account.repository

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface HotelAdminRepository : JpaRepository<HotelAdmin, Long> {

	fun existsByLoginId(loginId: String): Boolean

	fun existsByLoginIdAndIdNot(loginId: String, id: Long): Boolean

	fun findByLoginIdAndActiveTrue(loginId: String): HotelAdmin?

	fun findByHotelIdAndRole(hotelId: Long, role: HotelAdminRole): HotelAdmin?

	@EntityGraph(attributePaths = ["hotel"])
	fun findWithHotelById(id: Long): HotelAdmin?
}
