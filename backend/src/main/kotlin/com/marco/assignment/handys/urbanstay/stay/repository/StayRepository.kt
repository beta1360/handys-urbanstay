package com.marco.assignment.handys.urbanstay.stay.repository

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.time.LocalDate

private const val ROOM = "room"
private const val GUEST = "guest"
private const val ROOM_HOTEL = "room.hotel"
private const val ROOM_ROOM_TYPE = "room.roomType"

interface StayRepository : JpaRepository<Stay, Long>, JpaSpecificationExecutor<Stay> {

	@EntityGraph(attributePaths = [ROOM, GUEST])
	fun findByIdAndRoomHotelId(id: Long, hotelId: Long): Stay?

	@EntityGraph(attributePaths = [ROOM, GUEST])
	override fun findAll(spec: Specification<Stay>, pageable: Pageable): Page<Stay>

	@EntityGraph(attributePaths = [ROOM_HOTEL, ROOM_ROOM_TYPE])
	fun findByGuestMemberId(memberId: Long, pageable: Pageable): Page<Stay>

	@EntityGraph(attributePaths = [ROOM_HOTEL, ROOM_ROOM_TYPE])
	fun findByGuestMemberIdAndCheckOutDateAfter(memberId: Long, today: LocalDate, pageable: Pageable): Page<Stay>

	@EntityGraph(attributePaths = [ROOM_HOTEL, ROOM_ROOM_TYPE])
	fun findByGuestMemberIdAndCheckOutDateLessThanEqual(memberId: Long, today: LocalDate, pageable: Pageable): Page<Stay>

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query(
		"""
		update Stay s set s.canceledAt = :canceledAt, s.canceledBy = :canceledBy, s.canceledByName = :canceledByName,
			s.cancelReason = :cancelReason, s.updatedAt = :canceledAt
		where s.id = :id and s.canceledAt is null
		""",
	)
	fun cancel(id: Long, canceledBy: HotelAdmin, canceledByName: String, cancelReason: String?, canceledAt: Instant): Int

	@EntityGraph(attributePaths = [GUEST])
	fun findByRoomIdInAndCheckInDateLessThanEqualAndCheckOutDateAfterAndCanceledAtIsNull(
		roomIds: Collection<Long>,
		checkInDate: LocalDate,
		checkOutDate: LocalDate,
	): List<Stay>

	@Query(
		"""
		select distinct s.room.id from Stay s
		where s.room.id in :roomIds and s.canceledAt is null and s.checkInDate < :checkOutDate and s.checkOutDate > :checkInDate
		""",
	)
	fun findOverlappedRoomIds(roomIds: Collection<Long>, checkInDate: LocalDate, checkOutDate: LocalDate): List<Long>

	@Query(
		"""
		select new com.marco.assignment.handys.urbanstay.stay.repository.StaySettlementSummary(
			coalesce(sum(s.totalAmount) filter (where s.canceledAt is null), 0L),
			count(s) filter (where s.canceledAt is null),
			count(s) filter (where s.canceledAt is not null)
		)
		from Stay s
		where s.room.hotel.id = :hotelId and s.checkInDate between :startDate and :endDate
		""",
	)
	fun summarize(hotelId: Long, startDate: LocalDate, endDate: LocalDate): StaySettlementSummary

	@EntityGraph(attributePaths = [ROOM, "room.roomType", GUEST])
	fun findByRoomHotelIdAndCheckInDateBetween(hotelId: Long, startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<Stay>

	@EntityGraph(attributePaths = [ROOM_ROOM_TYPE])
	fun findFirstByGuestIdAndCheckInDateLessThanEqualAndCheckOutDateAfterAndCanceledAtIsNullOrderByCheckInDateAscIdAsc(
		guestId: Long,
		checkInDate: LocalDate,
		checkOutDate: LocalDate,
	): Stay?
}
