package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.config.InitialAdminProperties
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class InitialAdminService(
	private val appAdminRepository: AppAdminRepository,
	private val passwordEncoder: PasswordEncoder,
) {

	private val log = LoggerFactory.getLogger(javaClass)

	@Transactional
	fun createIfAbsent(properties: InitialAdminProperties) {
		if (appAdminRepository.count() > 0) {
			return
		}
		val passwordHash = checkNotNull(passwordEncoder.encode(properties.password))
		val admin = appAdminRepository.save(AppAdmin(properties.loginId, passwordHash, properties.name))
		log.info("Created initial app admin: id={}", admin.id)
	}
}
