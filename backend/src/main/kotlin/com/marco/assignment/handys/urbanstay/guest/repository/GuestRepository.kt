package com.marco.assignment.handys.urbanstay.guest.repository

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor

interface GuestRepository : JpaRepository<Guest, Long>, JpaSpecificationExecutor<Guest> {

	fun findByIdAndHotelId(id: Long, hotelId: Long): Guest?
}
