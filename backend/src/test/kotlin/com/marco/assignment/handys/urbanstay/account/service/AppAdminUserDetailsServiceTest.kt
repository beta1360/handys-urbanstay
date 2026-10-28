package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Import
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class AppAdminUserDetailsServiceTest {

	@Autowired
	private lateinit var appAdminUserDetailsService: AppAdminUserDetailsService

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

	@Autowired
	private lateinit var applicationContext: ApplicationContext

	@Test
	fun `대소문자와 앞뒤 공백이 다른 로그인 아이디로도 어드민을 찾고 APP_ADMIN 역할을 준다`() {
		val admin = appAdminRepository.saveAndFlush(AppAdmin("user-details@test.local", PASSWORD_HASH, NAME))

		val user = appAdminUserDetailsService.loadUserByUsername("  User-Details@TEST.local ")

		assertThat(user.username).isEqualTo(admin.loginId)
		assertThat(user.password).isEqualTo(admin.passwordHash)
		assertThat(user.authorities.map { it.authority }).containsExactly("ROLE_APP_ADMIN")
	}

	@Test
	fun `없는 로그인 아이디면 UsernameNotFoundException을 던진다`() {
		assertThatThrownBy { appAdminUserDetailsService.loadUserByUsername("unknown@test.local") }
			.isInstanceOf(UsernameNotFoundException::class.java)
	}

	@Test
	fun `UserDetailsService 빈은 전체 어드민용 하나뿐이라 Spring Boot 기본 사용자를 만들지 않는다`() {
		assertThat(applicationContext.getBeansOfType(UserDetailsService::class.java).values)
			.singleElement()
			.isInstanceOf(AppAdminUserDetailsService::class.java)
	}

	companion object {
		private const val PASSWORD_HASH = "password-hash"
		private const val NAME = "어드민"
	}
}
