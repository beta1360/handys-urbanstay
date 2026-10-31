package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AppAdminService(
	private val appAdminRepository: AppAdminRepository,
	private val passwordEncoder: PasswordEncoder,
) {

	@Transactional(readOnly = true)
	fun getAdmins(page: Int, size: Int): Page<AppAdmin> =
		appAdminRepository.findAll(PageRequest.of(page, size, NEWEST_FIRST))

	@Transactional(readOnly = true)
	fun getAdmin(adminId: Long): AppAdmin = findAdmin(adminId)

	@Transactional
	fun create(loginId: String, name: String, password: String): AppAdmin {
		if (appAdminRepository.existsByLoginId(LoginId.normalize(loginId))) {
			throw BusinessException(AccountErrorCode.LOGIN_ID_DUPLICATED)
		}
		val passwordHash = checkNotNull(passwordEncoder.encode(password))
		return translateConflicts { appAdminRepository.saveAndFlush(AppAdmin(loginId, passwordHash, name)) }
	}

	@Transactional
	fun update(adminId: Long, version: Long, name: String): AppAdmin {
		val admin = findAdmin(adminId)
		if (admin.version != version) {
			throw BusinessException(AccountErrorCode.APP_ADMIN_MODIFIED)
		}
		admin.rename(name)
		return translateConflicts { appAdminRepository.saveAndFlush(admin) }
	}

	private fun findAdmin(adminId: Long): AppAdmin =
		appAdminRepository.findByIdOrNull(adminId) ?: throw BusinessException(AccountErrorCode.APP_ADMIN_NOT_FOUND)

	private fun translateConflicts(save: () -> AppAdmin): AppAdmin =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(AppAdmin.LOGIN_ID_UNIQUE_CONSTRAINT)) BusinessException(AccountErrorCode.LOGIN_ID_DUPLICATED) else e
		} catch (e: OptimisticLockingFailureException) {
			throw BusinessException(AccountErrorCode.APP_ADMIN_MODIFIED)
		}

	companion object {
		private val NEWEST_FIRST = Sort.by(Sort.Direction.DESC, AppAdmin::id.name)
	}
}
