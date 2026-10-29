package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class HotelMasterService(
	private val hotelService: HotelService,
	private val hotelAdminService: HotelAdminService,
	private val hotelAdminRepository: HotelAdminRepository,
) {

	@Transactional(readOnly = true)
	fun getMaster(hotelId: Long): HotelAdmin = findMaster(hotelId)

	@Transactional
	fun update(hotelId: Long, version: Long, loginId: String, name: String): HotelAdmin =
		hotelAdminService.update(findMaster(hotelId), version, loginId, name)

	private fun findMaster(hotelId: Long): HotelAdmin {
		hotelService.getHotel(hotelId)
		return hotelAdminRepository.findByHotelIdAndRole(hotelId, HotelAdminRole.MASTER)
			?: throw BusinessException(AccountErrorCode.HOTEL_MASTER_NOT_FOUND)
	}
}
