package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import jakarta.persistence.LockModeType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant

interface RoomRepository : JpaRepository<Room, Long> {

	fun existsByHotelIdAndName(hotelId: Long, name: String): Boolean

	fun existsByHotelIdAndNameAndIdNot(hotelId: Long, name: String, id: Long): Boolean

	fun findByIdAndHotelId(id: Long, hotelId: Long): Room?

	fun findByHotelId(hotelId: Long, pageable: Pageable): Page<Room>

	fun findByHotelIdAndNameContainingIgnoreCase(hotelId: Long, keyword: String, pageable: Pageable): Page<Room>

	fun findByHotelIdAndStatus(hotelId: Long, status: RoomStatus, pageable: Pageable): Page<Room>

	fun findByHotelIdAndStatusAndNameContainingIgnoreCase(hotelId: Long, status: RoomStatus, keyword: String, pageable: Pageable): Page<Room>

	@Query("select r from Room r where r.hotel.id = :hotelId order by collate(r.type as natural_sort), r.id")
	fun findByHotelIdInTypeOrder(hotelId: Long): List<Room>

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select r from Room r where r.hotel.id = :hotelId and r.type = :type order by r.id")
	fun lockByHotelIdAndType(hotelId: Long, type: String): List<Room>

	@EntityGraph(attributePaths = ["hotel"])
	fun findByIdIn(ids: Collection<Long>, sort: Sort): List<Room>

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query(
		"""
		update Room r set r.status = :to, r.updatedAt = :updatedAt
		where r.id = :id and r.hotel.id = :hotelId and r.status = :from
		""",
	)
	fun updateStatus(id: Long, hotelId: Long, from: RoomStatus, to: RoomStatus, updatedAt: Instant): Int
}
