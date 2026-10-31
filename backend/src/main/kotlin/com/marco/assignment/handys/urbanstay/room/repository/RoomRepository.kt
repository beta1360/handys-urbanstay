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

private const val ROOM_TYPE = "roomType"

interface RoomRepository : JpaRepository<Room, Long> {

	fun existsByHotelIdAndName(hotelId: Long, name: String): Boolean

	fun existsByHotelIdAndNameAndIdNot(hotelId: Long, name: String, id: Long): Boolean

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByIdAndHotelId(id: Long, hotelId: Long): Room?

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelId(hotelId: Long, pageable: Pageable): Page<Room>

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelIdAndNameContainingIgnoreCase(hotelId: Long, keyword: String, pageable: Pageable): Page<Room>

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelIdAndStatus(hotelId: Long, status: RoomStatus, pageable: Pageable): Page<Room>

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelIdAndStatusAndNameContainingIgnoreCase(hotelId: Long, status: RoomStatus, keyword: String, pageable: Pageable): Page<Room>

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findAllByHotelId(hotelId: Long): List<Room>

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select r from Room r where r.roomType.id = :roomTypeId order by r.id")
	fun lockByRoomTypeId(roomTypeId: Long): List<Room>

	@EntityGraph(attributePaths = ["hotel", ROOM_TYPE])
	fun findByIdIn(ids: Collection<Long>, sort: Sort): List<Room>

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query(
		"""
		update Room r set r.status = :to, r.updatedAt = :updatedAt
		where r.id = :id and r.hotel.id = :hotelId and r.status = :from
		""",
	)
	fun updateStatus(id: Long, hotelId: Long, from: RoomStatus, to: RoomStatus, updatedAt: Instant): Int

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelIdAndRoomTypeId(hotelId: Long, roomTypeId: Long, pageable: Pageable): Page<Room>

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelIdAndRoomTypeIdAndNameContainingIgnoreCase(hotelId: Long, roomTypeId: Long, keyword: String, pageable: Pageable): Page<Room>

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelIdAndRoomTypeIdAndStatus(hotelId: Long, roomTypeId: Long, status: RoomStatus, pageable: Pageable): Page<Room>

	@EntityGraph(attributePaths = [ROOM_TYPE])
	fun findByHotelIdAndRoomTypeIdAndStatusAndNameContainingIgnoreCase(
		hotelId: Long,
		roomTypeId: Long,
		status: RoomStatus,
		keyword: String,
		pageable: Pageable,
	): Page<Room>
}
