package com.marco.assignment.handys.urbanstay.hotel.repository

import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor

interface HotelRepository : JpaRepository<Hotel, Long>, JpaSpecificationExecutor<Hotel> {

	fun existsByNameAndAddress(name: String, address: String): Boolean

	fun existsByNameAndAddressAndIdNot(name: String, address: String, id: Long): Boolean
}
