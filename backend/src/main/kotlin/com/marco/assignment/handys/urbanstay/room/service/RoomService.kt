package com.marco.assignment.handys.urbanstay.room.service

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminService
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatusHistory
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomStatusHistoryRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant

@Service
class RoomService(
	private val roomRepository: RoomRepository,
	private val roomStatusHistoryRepository: RoomStatusHistoryRepository,
	private val hotelService: HotelService,
	private val roomTypeService: RoomTypeService,
	private val hotelAdminService: HotelAdminService,
	private val clock: Clock,
) {

	@Transactional
	fun create(
		hotelId: Long,
		hotelAdminId: Long,
		name: String,
		roomTypeId: Long,
		floor: Int?,
		description: String?,
	): Room {
		val hotel = hotelService.getHotel(hotelId)
		val roomType = roomTypeService.getRoomType(hotelId, roomTypeId)
		checkNotDuplicated(hotelId, name, null)
		val createdBy = hotelAdminService.getHotelAdmin(hotelAdminId)
		val room = translateConflicts { roomRepository.saveAndFlush(Room(hotel, name, roomType, floor, description)) }
		roomStatusHistoryRepository.save(RoomStatusHistory(room, null, room.status, createdBy))
		return room
	}

	@Transactional(readOnly = true)
	fun getRooms(hotelId: Long, keyword: String?, status: RoomStatus?, page: Int, size: Int): Page<Room> {
		val pageable = PageRequest.of(page, size, NAME_ORDER)
		val nameKeyword = keyword?.trim()?.ifEmpty { null }
		return if (status == null) {
			if (nameKeyword == null) {
				roomRepository.findByHotelId(hotelId, pageable)
			} else {
				roomRepository.findByHotelIdAndNameContainingIgnoreCase(hotelId, nameKeyword, pageable)
			}
		} else if (nameKeyword == null) {
			roomRepository.findByHotelIdAndStatus(hotelId, status, pageable)
		} else {
			roomRepository.findByHotelIdAndStatusAndNameContainingIgnoreCase(hotelId, status, nameKeyword, pageable)
		}
	}

	@Transactional(readOnly = true)
	fun getHotelRooms(hotelId: Long): List<Room> = roomRepository.findAllByHotelId(hotelId)

	@Transactional
	fun lockRoomsByType(roomTypeId: Long): List<Room> {
		val locked = roomRepository.lockByRoomTypeId(roomTypeId)
		if (locked.isEmpty()) {
			return emptyList()
		}
		return roomRepository.findByIdIn(locked.map { checkNotNull(it.id) }, NAME_ORDER)
	}

	@Transactional(readOnly = true)
	fun getRoom(hotelId: Long, roomId: Long): Room = findRoom(hotelId, roomId)

	@Transactional
	fun update(
		hotelId: Long,
		roomId: Long,
		version: Long,
		name: String,
		roomTypeId: Long,
		floor: Int?,
		description: String?,
	): Room {
		val room = findRoom(hotelId, roomId)
		if (room.version != version) {
			throw BusinessException(RoomErrorCode.ROOM_MODIFIED)
		}
		val roomType = roomTypeService.getRoomType(hotelId, roomTypeId)
		checkNotDuplicated(hotelId, name, roomId)
		room.update(name, roomType, floor, description)
		return translateConflicts { roomRepository.saveAndFlush(room) }
	}

	@Transactional
	fun changeStatus(hotelId: Long, roomId: Long, hotelAdminId: Long, from: RoomStatus, to: RoomStatus): Room {
		findRoom(hotelId, roomId)
		if (!from.canChangeTo(to)) {
			throw BusinessException(RoomErrorCode.ROOM_STATUS_TRANSITION_NOT_ALLOWED)
		}
		if (roomRepository.updateStatus(roomId, hotelId, from, to, Instant.now(clock)) == 0) {
			throw BusinessException(RoomErrorCode.ROOM_STATUS_CHANGED)
		}
		val changedBy = hotelAdminService.getHotelAdmin(hotelAdminId)
		val room = findRoom(hotelId, roomId)
		roomStatusHistoryRepository.save(RoomStatusHistory(room, from, to, changedBy))
		return room
	}

	@Transactional
	fun releaseReservation(hotelId: Long, roomId: Long, hotelAdminId: Long) {
		if (roomRepository.updateStatus(roomId, hotelId, RoomStatus.RESERVED, RoomStatus.VACANT, Instant.now(clock)) == 0) {
			return
		}
		val changedBy = hotelAdminService.getHotelAdmin(hotelAdminId)
		roomStatusHistoryRepository.save(RoomStatusHistory(findRoom(hotelId, roomId), RoomStatus.RESERVED, RoomStatus.VACANT, changedBy))
	}

	@Transactional(readOnly = true)
	fun getStatusHistories(hotelId: Long, roomId: Long, page: Int, size: Int): Page<RoomStatusHistory> {
		findRoom(hotelId, roomId)
		return roomStatusHistoryRepository.findByRoomId(roomId, PageRequest.of(page, size, NEWEST_FIRST))
	}

	private fun findRoom(hotelId: Long, roomId: Long): Room =
		roomRepository.findByIdAndHotelId(roomId, hotelId) ?: throw BusinessException(RoomErrorCode.ROOM_NOT_FOUND)

	private fun checkNotDuplicated(hotelId: Long, name: String, roomId: Long?) {
		val normalizedName = Room.normalize(name)
		val duplicated = if (roomId == null) {
			roomRepository.existsByHotelIdAndName(hotelId, normalizedName)
		} else {
			roomRepository.existsByHotelIdAndNameAndIdNot(hotelId, normalizedName, roomId)
		}
		if (duplicated) {
			throw BusinessException(RoomErrorCode.ROOM_DUPLICATED)
		}
	}

	private fun translateConflicts(save: () -> Room): Room =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(Room.HOTEL_NAME_UNIQUE_CONSTRAINT)) BusinessException(RoomErrorCode.ROOM_DUPLICATED) else e
		} catch (e: OptimisticLockingFailureException) {
			throw BusinessException(RoomErrorCode.ROOM_MODIFIED)
		}

	companion object {
		private val NAME_ORDER = Sort.by(Sort.Order.asc(Room::name.name), Sort.Order.asc(Room::id.name))
		private val NEWEST_FIRST = Sort.by(Sort.Order.desc(RoomStatusHistory::createdAt.name), Sort.Order.desc(RoomStatusHistory::id.name))
	}
}
