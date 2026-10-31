package com.marco.assignment.handys.urbanstay.account.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import com.marco.assignment.handys.urbanstay.common.exception.violates
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
class AppAdminRepositoryTest {

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

	@Autowired
	private lateinit var entityManager: TestEntityManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Test
	fun `로그인 아이디는 앞뒤 공백을 지우고 소문자로 바꿔 저장한다`() {
		appAdminRepository.saveAndFlush(AppAdmin(" Normalize@Test.LOCAL ", PASSWORD_HASH, NAME))
		entityManager.clear()

		val found = appAdminRepository.findByLoginId("normalize@test.local")

		assertThat(found?.loginId).isEqualTo("normalize@test.local")
	}

	@Test
	fun `대소문자와 공백만 다른 로그인 아이디는 이름 있는 DB 유일 제약으로 저장을 막는다`() {
		appAdminRepository.saveAndFlush(AppAdmin("duplicate@test.local", PASSWORD_HASH, NAME))

		assertThatThrownBy { appAdminRepository.saveAndFlush(AppAdmin(" Duplicate@TEST.local ", PASSWORD_HASH, NAME)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(AppAdmin.LOGIN_ID_UNIQUE_CONSTRAINT)).isTrue()
			}
	}

	@ParameterizedTest
	@ValueSource(strings = ["Upper@test.local", " leading@test.local", "trailing@test.local "])
	fun `정규화되지 않은 로그인 아이디는 DB CHECK 제약이 저장을 막는다`(loginId: String) {
		assertThatThrownBy { insertWithoutEntity(loginId, NAME) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("app_admin_login_id_check")
	}

	@ParameterizedTest
	@ValueSource(strings = ["", "   "])
	fun `빈 이름은 DB CHECK 제약이 저장을 막는다`(name: String) {
		assertThatThrownBy { insertWithoutEntity("blank-name@test.local", name) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("app_admin_name_check")
	}

	private fun insertWithoutEntity(loginId: String, name: String) {
		jdbcTemplate.update(INSERT_APP_ADMIN, loginId, PASSWORD_HASH, name)
	}

	companion object {
		private const val PASSWORD_HASH = "password-hash"
		private const val NAME = "어드민"
		private const val INSERT_APP_ADMIN =
			"insert into app_admin (login_id, password_hash, name, version, created_at, updated_at) values (?, ?, ?, 0, now(), now())"
	}
}
