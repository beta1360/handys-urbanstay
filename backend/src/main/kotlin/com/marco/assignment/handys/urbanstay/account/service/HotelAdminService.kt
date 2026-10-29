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
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class HotelAdminService(
	private val hotelAdminRepository: HotelAdminRepository,
	private val passwordEncoder: PasswordEncoder,
) {

	@Transactional(readOnly = true)
	fun checkLoginIdAvailable(loginId: String, hotelAdminId: Long? = null) {
		val normalizedLoginId = LoginId.normalize(loginId)
		val duplicated = if (hotelAdminId == null) {
			hotelAdminRepository.existsByLoginId(normalizedLoginId)
		} else {
			hotelAdminRepository.existsByLoginIdAndIdNot(normalizedLoginId, hotelAdminId)
		}
		if (duplicated) {
			throw BusinessException(AccountErrorCode.LOGIN_ID_DUPLICATED)
		}
	}

	@Transactional
	fun createMaster(hotel: Hotel, loginId: String, name: String, password: String): HotelAdmin {
		val passwordHash = checkNotNull(passwordEncoder.encode(password))
		return translateConflicts { hotelAdminRepository.saveAndFlush(HotelAdmin(hotel, loginId, passwordHash, name, HotelAdminRole.MASTER)) }
	}

	@Transactional
	fun update(hotelAdmin: HotelAdmin, version: Long, loginId: String, name: String): HotelAdmin {
		if (hotelAdmin.version != version) {
			throw BusinessException(AccountErrorCode.HOTEL_ADMIN_MODIFIED)
		}
		checkLoginIdAvailable(loginId, checkNotNull(hotelAdmin.id))
		hotelAdmin.update(loginId, name)
		return translateConflicts { hotelAdminRepository.saveAndFlush(hotelAdmin) }
	}

	private fun translateConflicts(save: () -> HotelAdmin): HotelAdmin =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(HotelAdmin.LOGIN_ID_UNIQUE_CONSTRAINT)) BusinessException(AccountErrorCode.LOGIN_ID_DUPLICATED) else e
		} catch (e: OptimisticLockingFailureException) {
			throw BusinessException(AccountErrorCode.HOTEL_ADMIN_MODIFIED)
		}
}
