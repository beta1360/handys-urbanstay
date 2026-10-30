package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant

interface RoomRepository : JpaRepository<Room, Long> {

	fun existsByHotelIdAndName(hotelId: Long, name: String): Boolean

	fun existsByHotelIdAndNameAndIdNot(hotelId: Long, name: String, id: Long): Boolean

	fun findByIdAndHotelId(id: Long, hotelId: Long): Room?

	fun findByHotelId(hotelId: Long, pageable: Pageable): Page<Room>

	fun findByHotelIdAndNameContainingIgnoreCase(hotelId: Long, keyword: String, pageable: Pageable): Page<Room>

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query(
		"""
		update Room r set r.status = :to, r.updatedAt = :updatedAt
		where r.id = :id and r.hotel.id = :hotelId and r.status = :from
		""",
	)
	fun updateStatus(id: Long, hotelId: Long, from: RoomStatus, to: RoomStatus, updatedAt: Instant): Int
}
