package com.marco.assignment.handys.urbanstay.room.service

import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalTime

@Service
class RoomService(
	private val roomRepository: RoomRepository,
	private val hotelService: HotelService,
) {

	@Transactional
	fun create(
		hotelId: Long,
		name: String,
		type: String,
		capacity: Int,
		floor: Int?,
		description: String?,
		checkInTime: LocalTime,
		checkOutTime: LocalTime,
	): Room {
		val hotel = hotelService.getHotel(hotelId)
		checkNotDuplicated(hotelId, name)
		return translateConflicts {
			roomRepository.saveAndFlush(Room(hotel, name, type, capacity, floor, description, checkInTime, checkOutTime))
		}
	}

	@Transactional(readOnly = true)
	fun getRoom(hotelId: Long, roomId: Long): Room = findRoom(hotelId, roomId)

	private fun findRoom(hotelId: Long, roomId: Long): Room =
		roomRepository.findByIdAndHotelId(roomId, hotelId) ?: throw BusinessException(RoomErrorCode.ROOM_NOT_FOUND)

	private fun checkNotDuplicated(hotelId: Long, name: String) {
		if (roomRepository.existsByHotelIdAndName(hotelId, Room.normalize(name))) {
			throw BusinessException(RoomErrorCode.ROOM_DUPLICATED)
		}
	}

	private fun translateConflicts(save: () -> Room): Room =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(Room.HOTEL_NAME_UNIQUE_CONSTRAINT)) BusinessException(RoomErrorCode.ROOM_DUPLICATED) else e
		}
}
