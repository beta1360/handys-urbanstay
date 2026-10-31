package com.marco.assignment.handys.urbanstay.stay.repository

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.time.LocalDate

private const val ROOM = "room"
private const val GUEST = "guest"

interface StayRepository : JpaRepository<Stay, Long> {

	fun existsByRoomIdAndCheckInDateBeforeAndCheckOutDateAfterAndCanceledAtIsNull(roomId: Long, checkOutDate: LocalDate, checkInDate: LocalDate): Boolean

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

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query(
		"""
		update Stay s set s.canceledAt = :canceledAt, s.canceledBy = :canceledBy, s.canceledByName = :canceledByName,
			s.cancelReason = :cancelReason, s.updatedAt = :canceledAt
		where s.id = :id and s.canceledAt is null
		""",
	)
	fun cancel(id: Long, canceledBy: HotelAdmin, canceledByName: String, cancelReason: String?, canceledAt: Instant): Int
}
