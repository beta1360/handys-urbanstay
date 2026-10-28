package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.dao.DataAccessResourceFailureException
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import java.lang.reflect.Proxy

class AppAdminAuthServiceTest {

	@Test
	fun `계정을 읽다가 오류가 나면 로그인 실패가 아니라 서버 오류로 던진다`() {
		val failingRepository = Proxy.newProxyInstance(javaClass.classLoader, arrayOf(AppAdminRepository::class.java)) { _, _, _ ->
			throw DataAccessResourceFailureException("database unavailable")
		} as AppAdminRepository
		val service = AppAdminAuthService(
			AppAdminUserDetailsService(failingRepository),
			PasswordEncoderFactories.createDelegatingPasswordEncoder(),
			failingRepository,
		)

		assertThatThrownBy { service.authenticate("admin@test.local", "password") }
			.isInstanceOf(IllegalStateException::class.java)
			.hasRootCauseInstanceOf(DataAccessResourceFailureException::class.java)
	}
}
