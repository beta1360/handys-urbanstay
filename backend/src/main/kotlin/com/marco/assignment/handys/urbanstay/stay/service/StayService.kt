package com.marco.assignment.handys.urbanstay.stay.service

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
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class StayService(
	private val stayRepository: StayRepository,
	private val roomService: RoomService,
	private val guestService: GuestService,
	private val clock: Clock,
) {

	@Transactional
	fun create(hotelId: Long, roomId: Long, guestId: Long, checkInDate: LocalDate, checkOutDate: LocalDate, guestCount: Int): Stay {
		val room = roomService.getRoom(hotelId, roomId)
		val guest = guestService.getGuest(hotelId, guestId)
		checkValid(room, checkInDate, checkOutDate, guestCount)
		checkNotOverlapped(roomId, checkInDate, checkOutDate)
		return translateConflicts { stayRepository.saveAndFlush(Stay(room, guest, checkInDate, checkOutDate, guestCount)) }
	}

	@Transactional(readOnly = true)
	fun getStays(hotelId: Long, roomId: Long?, guestId: Long?, page: Int, size: Int): Page<Stay> {
		val pageable = PageRequest.of(page, size, LATEST_CHECK_IN_FIRST)
		return if (roomId == null) {
			if (guestId == null) {
				stayRepository.findByRoomHotelId(hotelId, pageable)
			} else {
				stayRepository.findByGuestIdAndRoomHotelId(guestId, hotelId, pageable)
			}
		} else if (guestId == null) {
			stayRepository.findByRoomIdAndRoomHotelId(roomId, hotelId, pageable)
		} else {
			stayRepository.findByRoomIdAndGuestIdAndRoomHotelId(roomId, guestId, hotelId, pageable)
		}
	}

	@Transactional(readOnly = true)
	fun getStay(hotelId: Long, stayId: Long): Stay =
		stayRepository.findByIdAndRoomHotelId(stayId, hotelId) ?: throw BusinessException(StayErrorCode.STAY_NOT_FOUND)

	private fun checkValid(room: Room, checkInDate: LocalDate, checkOutDate: LocalDate, guestCount: Int) {
		val invalidFields = listOfNotNull(
			InvalidField(Stay::checkInDate.name, TODAY_OR_LATER).takeIf { checkInDate < LocalDate.now(clock) },
			invalidCheckOutDate(checkInDate, checkOutDate),
			InvalidField(Stay::guestCount.name, MAX_VALUE, mapOf("value" to room.capacity)).takeIf { guestCount > room.capacity },
		)
		if (invalidFields.isNotEmpty()) {
			throw BusinessException(CommonErrorCode.INVALID_INPUT, invalidFields)
		}
	}

	private fun invalidCheckOutDate(checkInDate: LocalDate, checkOutDate: LocalDate): InvalidField? =
		when {
			checkOutDate <= checkInDate -> InvalidField(Stay::checkOutDate.name, AFTER_CHECK_IN)
			ChronoUnit.DAYS.between(checkInDate, checkOutDate) > Stay.MAX_NIGHTS ->
				InvalidField(Stay::checkOutDate.name, MAX_NIGHTS, mapOf("max" to Stay.MAX_NIGHTS))
			else -> null
		}

	private fun checkNotOverlapped(roomId: Long, checkInDate: LocalDate, checkOutDate: LocalDate) {
		if (stayRepository.existsByRoomIdAndCheckInDateBeforeAndCheckOutDateAfter(roomId, checkOutDate, checkInDate)) {
			throw BusinessException(StayErrorCode.STAY_PERIOD_OVERLAPPED)
		}
	}

	private fun translateConflicts(save: () -> Stay): Stay =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(Stay.ROOM_PERIOD_EXCLUSION_CONSTRAINT)) BusinessException(StayErrorCode.STAY_PERIOD_OVERLAPPED) else e
		}

	companion object {
		private val LATEST_CHECK_IN_FIRST = Sort.by(Sort.Order.desc(Stay::checkInDate.name), Sort.Order.desc(Stay::id.name))
		private const val TODAY_OR_LATER = "validation.today-or-later"
		private const val AFTER_CHECK_IN = "validation.after-check-in"
		private const val MAX_NIGHTS = "validation.max-nights"
		private const val MAX_VALUE = "validation.max"
	}
}
