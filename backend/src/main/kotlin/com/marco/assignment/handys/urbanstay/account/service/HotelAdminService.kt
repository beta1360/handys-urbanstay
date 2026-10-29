package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class HotelAdminService(
	private val hotelAdminRepository: HotelAdminRepository,
	private val passwordEncoder: PasswordEncoder,
) {

	@Transactional(readOnly = true)
	fun checkLoginIdAvailable(loginId: String) {
		if (hotelAdminRepository.existsByLoginId(LoginId.normalize(loginId))) {
			throw BusinessException(AccountErrorCode.LOGIN_ID_DUPLICATED)
		}
	}

	@Transactional
	fun createMaster(hotel: Hotel, loginId: String, name: String, password: String): HotelAdmin {
		val passwordHash = checkNotNull(passwordEncoder.encode(password))
		return translateConflicts { hotelAdminRepository.saveAndFlush(HotelAdmin(hotel, loginId, passwordHash, name, HotelAdminRole.MASTER)) }
	}

	private fun translateConflicts(save: () -> HotelAdmin): HotelAdmin =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(HotelAdmin.LOGIN_ID_UNIQUE_CONSTRAINT)) BusinessException(AccountErrorCode.LOGIN_ID_DUPLICATED) else e
		}
}
