package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminSpecifications
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class HotelOperatorService(
	private val hotelService: HotelService,
	private val hotelAdminService: HotelAdminService,
	private val hotelAdminRepository: HotelAdminRepository,
) {

	@Transactional
	fun create(hotelId: Long, loginId: String, name: String, password: String): HotelAdmin =
		hotelAdminService.createOperator(hotelService.getHotel(hotelId), loginId, name, password)

	@Transactional(readOnly = true)
	fun getOperators(hotelId: Long, keyword: String?, active: Boolean?, page: Int, size: Int): Page<HotelAdmin> {
		val specification = HotelAdminSpecifications.search(hotelId, HotelAdminRole.OPERATOR, active, keyword?.trim()?.ifEmpty { null })
		return hotelAdminRepository.findAll(specification, PageRequest.of(page, size, NEWEST_FIRST))
	}

	@Transactional(readOnly = true)
	fun getOperator(hotelId: Long, operatorId: Long): HotelAdmin = findOperator(hotelId, operatorId)

	private fun findOperator(hotelId: Long, operatorId: Long): HotelAdmin =
		hotelAdminRepository.findByIdAndHotelIdAndRole(operatorId, hotelId, HotelAdminRole.OPERATOR)
			?: throw BusinessException(AccountErrorCode.HOTEL_OPERATOR_NOT_FOUND)

	companion object {
		private val NEWEST_FIRST = Sort.by(Sort.Direction.DESC, HotelAdmin::id.name)
	}
}
