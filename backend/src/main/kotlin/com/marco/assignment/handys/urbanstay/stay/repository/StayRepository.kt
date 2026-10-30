package com.marco.assignment.handys.urbanstay.stay.repository

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

private const val ROOM = "room"
private const val GUEST = "guest"

interface StayRepository : JpaRepository<Stay, Long> {

	fun existsByRoomIdAndCheckInDateBeforeAndCheckOutDateAfter(roomId: Long, checkOutDate: LocalDate, checkInDate: LocalDate): Boolean

	@EntityGraph(attributePaths = [ROOM, GUEST])
	fun findByIdAndRoomHotelId(id: Long, hotelId: Long): Stay?

	@EntityGraph(attributePaths = [ROOM, GUEST])
	fun findByRoomHotelId(hotelId: Long, pageable: Pageable): Page<Stay>

	@EntityGraph(attributePaths = [ROOM, GUEST])
	fun findByRoomIdAndRoomHotelId(roomId: Long, hotelId: Long, pageable: Pageable): Page<Stay>

	@EntityGraph(attributePaths = [ROOM, GUEST])
	fun findByGuestIdAndRoomHotelId(guestId: Long, hotelId: Long, pageable: Pageable): Page<Stay>

	@EntityGraph(attributePaths = [ROOM, GUEST])
	fun findByRoomIdAndGuestIdAndRoomHotelId(roomId: Long, guestId: Long, hotelId: Long, pageable: Pageable): Page<Stay>
}
