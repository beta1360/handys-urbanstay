package com.marco.assignment.handys.urbanstay.hotel.service

import com.marco.assignment.handys.urbanstay.account.service.HotelAdminService
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelSpecifications
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class HotelService(
	private val hotelRepository: HotelRepository,
	private val hotelAdminService: HotelAdminService,
) {

	@Transactional
	fun create(
		name: String,
		address: String,
		phone: String,
		description: String?,
		masterLoginId: String,
		masterName: String,
		masterPassword: String,
	): Hotel {
		checkNotDuplicated(name, address, null)
		hotelAdminService.checkLoginIdAvailable(masterLoginId)
		val hotel = translateConflicts { hotelRepository.saveAndFlush(Hotel(name, address, phone, description)) }
		hotelAdminService.createMaster(hotel, masterLoginId, masterName, masterPassword)
		return hotel
	}

	@Transactional(readOnly = true)
	fun getHotels(keyword: String?, page: Int, size: Int): Page<Hotel> {
		val pageable = PageRequest.of(page, size, NEWEST_FIRST)
		val searchKeyword = keyword?.trim()?.ifEmpty { null } ?: return hotelRepository.findAll(pageable)
		return hotelRepository.findAll(HotelSpecifications.search(searchKeyword), pageable)
	}

	@Transactional(readOnly = true)
	fun getHotelsByName(page: Int, size: Int): Page<Hotel> = hotelRepository.findAll(PageRequest.of(page, size, NAME_ORDER))

	@Transactional(readOnly = true)
	fun getHotel(hotelId: Long): Hotel = findHotel(hotelId)

	@Transactional
	fun update(hotelId: Long, version: Long, name: String, address: String, phone: String, description: String?): Hotel {
		val hotel = findHotel(hotelId)
		if (hotel.version != version) {
			throw BusinessException(HotelErrorCode.HOTEL_MODIFIED)
		}
		checkNotDuplicated(name, address, hotelId)
		hotel.update(name, address, phone, description)
		return translateConflicts { hotelRepository.saveAndFlush(hotel) }
	}

	private fun findHotel(hotelId: Long): Hotel =
		hotelRepository.findByIdOrNull(hotelId) ?: throw BusinessException(HotelErrorCode.HOTEL_NOT_FOUND)

	private fun checkNotDuplicated(name: String, address: String, hotelId: Long?) {
		val normalizedName = Hotel.normalize(name)
		val normalizedAddress = Hotel.normalize(address)
		val duplicated = if (hotelId == null) {
			hotelRepository.existsByNameAndAddress(normalizedName, normalizedAddress)
		} else {
			hotelRepository.existsByNameAndAddressAndIdNot(normalizedName, normalizedAddress, hotelId)
		}
		if (duplicated) {
			throw BusinessException(HotelErrorCode.HOTEL_DUPLICATED)
		}
	}

	private fun translateConflicts(save: () -> Hotel): Hotel =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(Hotel.NAME_ADDRESS_UNIQUE_CONSTRAINT)) BusinessException(HotelErrorCode.HOTEL_DUPLICATED) else e
		} catch (e: OptimisticLockingFailureException) {
			throw BusinessException(HotelErrorCode.HOTEL_MODIFIED)
		}

	companion object {
		private val NEWEST_FIRST = Sort.by(Sort.Direction.DESC, Hotel::id.name)
		private val NAME_ORDER = Sort.by(Sort.Order.asc(Hotel::name.name), Sort.Order.asc(Hotel::id.name))
	}
}
