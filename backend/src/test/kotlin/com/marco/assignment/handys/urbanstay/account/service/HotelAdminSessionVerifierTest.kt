package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.AuthorityUtils
import org.springframework.security.core.userdetails.User
import java.lang.reflect.Proxy

class HotelAdminSessionVerifierTest {

	@Test
	fun `호텔 계정이 아닌 세션은 계정을 읽지 않고 그대로 통과시킨다`() {
		val untouchedRepository = Proxy.newProxyInstance(javaClass.classLoader, arrayOf(HotelAdminRepository::class.java)) { _, method, _ ->
			throw AssertionError("repository must not be called: ${method.name}")
		} as HotelAdminRepository
		val appAdmin = User.withUsername("admin@test.local").password("password").roles("APP_ADMIN").build()
		val authentication = UsernamePasswordAuthenticationToken.authenticated(appAdmin, null, AuthorityUtils.createAuthorityList("ROLE_APP_ADMIN"))

		assertThat(HotelAdminSessionVerifier(untouchedRepository).isValid(authentication)).isTrue()
	}
}
