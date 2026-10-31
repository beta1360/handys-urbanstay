package com.marco.assignment.handys.urbanstay.stay.service

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminService
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.InvalidField
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.guest.service.GuestService
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.service.RoomService
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.exception.StayErrorCode
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import com.marco.assignment.handys.urbanstay.stay.repository.StaySpecifications
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class StayService(
	private val stayRepository: StayRepository,
	private val roomService: RoomService,
	private val guestService: GuestService,
	private val hotelAdminService: HotelAdminService,
	private val clock: Clock,
) {

	@Transactional
	fun reserve(
		roomId: Long,
		checkInDate: LocalDate,
		checkOutDate: LocalDate,
		guestCount: Int,
		guestName: String,
		guestPhone: String,
		guestEmail: String,
	): Stay {
		val room = roomService.getRoomWithHotel(roomId)
		checkValid(room, checkInDate, checkOutDate, guestCount)
		checkNotOverlapped(roomId, checkInDate, checkOutDate)
		val guest = guestService.getOrCreate(checkNotNull(room.hotel.id), guestName, guestPhone, guestEmail)
		return translateConflicts { stayRepository.saveAndFlush(Stay(room, guest, checkInDate, checkOutDate, guestCount)) }
	}

	@Transactional(readOnly = true)
	fun getRoomTypes(hotelId: Long, checkInDate: LocalDate, checkOutDate: LocalDate, guestCount: Int): List<RoomTypeAvailability> {
		checkPeriod(checkInDate, checkOutDate)
		val rooms = roomService.getHotelRoomsInTypeOrder(hotelId)
		val availableIds = availableRooms(rooms, checkInDate, checkOutDate, guestCount).mapTo(HashSet()) { it.id }
		return rooms.groupBy(Room::type).map { (type, typeRooms) ->
			RoomTypeAvailability(type, typeRooms.size, typeRooms.maxOf(Room::capacity), typeRooms.count { it.id in availableIds })
		}
	}

	@Transactional(readOnly = true)
	fun getReservedPeriods(roomId: Long, page: Int, size: Int): Page<Stay> {
		roomService.getRoomWithHotel(roomId)
		return stayRepository.findByRoomIdAndCanceledAtIsNullAndCheckOutDateAfter(roomId, LocalDate.now(clock), PageRequest.of(page, size, EARLIEST_CHECK_IN_FIRST))
	}

	@Transactional(readOnly = true)
	fun getStays(hotelId: Long, roomId: Long?, guestId: Long?, canceled: Boolean?, page: Int, size: Int): Page<Stay> =
		stayRepository.findAll(StaySpecifications.search(hotelId, roomId, guestId, canceled), PageRequest.of(page, size, LATEST_CHECK_IN_FIRST))

	@Transactional(readOnly = true)
	fun getStay(hotelId: Long, stayId: Long): Stay = findStay(hotelId, stayId)

	@Transactional
	fun cancel(hotelId: Long, stayId: Long, hotelAdminId: Long, reason: String?): Stay {
		val stay = findStay(hotelId, stayId)
		if (stay.canceledAt != null) {
			throw BusinessException(StayErrorCode.STAY_ALREADY_CANCELED)
		}
		if (stay.checkOutDate <= LocalDate.now(clock)) {
			throw BusinessException(StayErrorCode.STAY_ALREADY_ENDED)
		}
		val roomId = checkNotNull(stay.room.id)
		val canceledBy = hotelAdminService.getHotelAdmin(hotelAdminId)
		if (stayRepository.cancel(stayId, canceledBy, canceledBy.name, Stay.normalizeCancelReason(reason), Instant.now(clock)) == 0) {
			throw BusinessException(StayErrorCode.STAY_ALREADY_CANCELED)
		}
		roomService.releaseReservation(hotelId, roomId, hotelAdminId)
		return findStay(hotelId, stayId)
	}

	private fun findStay(hotelId: Long, stayId: Long): Stay =
		stayRepository.findByIdAndRoomHotelId(stayId, hotelId) ?: throw BusinessException(StayErrorCode.STAY_NOT_FOUND)

	private fun checkValid(room: Room, checkInDate: LocalDate, checkOutDate: LocalDate, guestCount: Int) {
		throwIfInvalid(
			invalidPeriod(checkInDate, checkOutDate) +
				listOfNotNull(InvalidField(Stay::guestCount.name, MAX_VALUE, mapOf("value" to room.capacity)).takeIf { guestCount > room.capacity }),
		)
	}

	private fun checkPeriod(checkInDate: LocalDate, checkOutDate: LocalDate) = throwIfInvalid(invalidPeriod(checkInDate, checkOutDate))

	private fun throwIfInvalid(invalidFields: List<InvalidField>) {
		if (invalidFields.isNotEmpty()) {
			throw BusinessException(CommonErrorCode.INVALID_INPUT, invalidFields)
		}
	}

	private fun invalidPeriod(checkInDate: LocalDate, checkOutDate: LocalDate): List<InvalidField> =
		listOfNotNull(
			InvalidField(Stay::checkInDate.name, TODAY_OR_LATER).takeIf { checkInDate < LocalDate.now(clock) },
			invalidCheckOutDate(checkInDate, checkOutDate),
		)

	private fun invalidCheckOutDate(checkInDate: LocalDate, checkOutDate: LocalDate): InvalidField? =
		when {
			checkOutDate <= checkInDate -> InvalidField(Stay::checkOutDate.name, AFTER_CHECK_IN)
			ChronoUnit.DAYS.between(checkInDate, checkOutDate) > Stay.MAX_NIGHTS ->
				InvalidField(Stay::checkOutDate.name, MAX_NIGHTS, mapOf("max" to Stay.MAX_NIGHTS))
			else -> null
		}

	private fun availableRooms(rooms: List<Room>, checkInDate: LocalDate, checkOutDate: LocalDate, guestCount: Int): List<Room> {
		val candidates = rooms.filter { it.capacity >= guestCount }
		if (candidates.isEmpty()) {
			return emptyList()
		}
		val overlappedIds = stayRepository.findOverlappedRoomIds(candidates.map { checkNotNull(it.id) }, checkInDate, checkOutDate).toSet()
		return candidates.filter { it.id !in overlappedIds }
	}

	private fun checkNotOverlapped(roomId: Long, checkInDate: LocalDate, checkOutDate: LocalDate) {
		if (stayRepository.existsByRoomIdAndCheckInDateBeforeAndCheckOutDateAfterAndCanceledAtIsNull(roomId, checkOutDate, checkInDate)) {
			throw BusinessException(StayErrorCode.STAY_PERIOD_OVERLAPPED)
		}
	}

	private fun translateConflicts(save: () -> Stay): Stay =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(Stay.ROOM_PERIOD_EXCLUSION_CONSTRAINT)) BusinessException(StayErrorCode.STAY_PERIOD_OVERLAPPED) else e
		}

	@Transactional(readOnly = true)
	fun getCurrentStays(roomIds: Collection<Long>): Map<Long, Stay> {
		if (roomIds.isEmpty()) {
			return emptyMap()
		}
		val today = LocalDate.now(clock)
		return stayRepository.findByRoomIdInAndCheckInDateLessThanEqualAndCheckOutDateAfterAndCanceledAtIsNull(roomIds, today, today)
			.associateBy { checkNotNull(it.room.id) }
	}

	companion object {
		private val LATEST_CHECK_IN_FIRST = Sort.by(Sort.Order.desc(Stay::checkInDate.name), Sort.Order.desc(Stay::id.name))
		private val EARLIEST_CHECK_IN_FIRST = Sort.by(Sort.Order.asc(Stay::checkInDate.name), Sort.Order.asc(Stay::id.name))
		private const val TODAY_OR_LATER = "validation.today-or-later"
		private const val AFTER_CHECK_IN = "validation.after-check-in"
		private const val MAX_NIGHTS = "validation.max-nights"
		private const val MAX_VALUE = "validation.max"
	}
}
