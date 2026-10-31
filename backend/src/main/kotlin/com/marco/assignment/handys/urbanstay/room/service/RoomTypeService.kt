package com.marco.assignment.handys.urbanstay.room.service

import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalTime

@Service
class RoomTypeService(
	private val roomTypeRepository: RoomTypeRepository,
	private val hotelService: HotelService,
) {

	@Transactional
	fun create(hotelId: Long, name: String, capacity: Int, roomRate: Int, checkInTime: LocalTime, checkOutTime: LocalTime): RoomType {
		val hotel = hotelService.getHotel(hotelId)
		checkNotDuplicated(hotelId, name, null)
		return translateConflicts { roomTypeRepository.saveAndFlush(RoomType(hotel, name, capacity, roomRate, checkInTime, checkOutTime)) }
	}

	@Transactional(readOnly = true)
	fun getRoomTypes(hotelId: Long): List<RoomType> {
		hotelService.getHotel(hotelId)
		return roomTypeRepository.findByHotelId(hotelId, NAME_ORDER)
	}

	@Transactional(readOnly = true)
	fun getRoomType(hotelId: Long, roomTypeId: Long): RoomType =
		roomTypeRepository.findByIdAndHotelId(roomTypeId, hotelId) ?: throw BusinessException(RoomErrorCode.ROOM_TYPE_NOT_FOUND)

	@Transactional
	fun update(
		hotelId: Long,
		roomTypeId: Long,
		version: Long,
		name: String,
		capacity: Int,
		roomRate: Int,
		checkInTime: LocalTime,
		checkOutTime: LocalTime,
	): RoomType {
		val roomType = getRoomType(hotelId, roomTypeId)
		if (roomType.version != version) {
			throw BusinessException(RoomErrorCode.ROOM_TYPE_MODIFIED)
		}
		checkNotDuplicated(hotelId, name, roomTypeId)
		roomType.update(name, capacity, roomRate, checkInTime, checkOutTime)
		return translateConflicts { roomTypeRepository.saveAndFlush(roomType) }
	}

	private fun checkNotDuplicated(hotelId: Long, name: String, roomTypeId: Long?) {
		val normalizedName = RoomType.normalize(name)
		val duplicated = if (roomTypeId == null) {
			roomTypeRepository.existsByHotelIdAndName(hotelId, normalizedName)
		} else {
			roomTypeRepository.existsByHotelIdAndNameAndIdNot(hotelId, normalizedName, roomTypeId)
		}
		if (duplicated) {
			throw BusinessException(RoomErrorCode.ROOM_TYPE_DUPLICATED)
		}
	}

	private fun translateConflicts(save: () -> RoomType): RoomType =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(RoomType.HOTEL_NAME_UNIQUE_CONSTRAINT)) BusinessException(RoomErrorCode.ROOM_TYPE_DUPLICATED) else e
		} catch (e: OptimisticLockingFailureException) {
			throw BusinessException(RoomErrorCode.ROOM_TYPE_MODIFIED)
		}

	companion object {
		private val NAME_ORDER = Sort.by(Sort.Order.asc(RoomType::name.name), Sort.Order.asc(RoomType::id.name))
	}
}
