package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.room.entity.Room
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface RoomRepository : JpaRepository<Room, Long> {

	fun existsByHotelIdAndName(hotelId: Long, name: String): Boolean

	fun findByIdAndHotelId(id: Long, hotelId: Long): Room?

	fun findByHotelId(hotelId: Long, pageable: Pageable): Page<Room>

	fun findByHotelIdAndNameContainingIgnoreCase(hotelId: Long, keyword: String, pageable: Pageable): Page<Room>
}
