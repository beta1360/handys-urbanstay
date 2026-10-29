package com.marco.assignment.handys.urbanstay.hotel.repository

import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface HotelRepository : JpaRepository<Hotel, Long> {

	fun existsByNameAndAddress(name: String, address: String): Boolean

	fun existsByNameAndAddressAndIdNot(name: String, address: String, id: Long): Boolean

	fun findByNameContainingIgnoreCase(keyword: String, pageable: Pageable): Page<Hotel>
}
