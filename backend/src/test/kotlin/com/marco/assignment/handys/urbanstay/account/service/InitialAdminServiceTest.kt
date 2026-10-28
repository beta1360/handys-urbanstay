package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.config.InitialAdminProperties
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import jakarta.persistence.EntityManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class InitialAdminServiceTest {

	@Autowired
	private lateinit var initialAdminService: InitialAdminService

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	@Autowired
	private lateinit var entityManager: EntityManager

	@Autowired
	private lateinit var initialAdminProperties: InitialAdminProperties

	@Autowired
	@Qualifier("initialAdminRunner")
	private lateinit var initialAdminRunner: ApplicationRunner

	@BeforeEach
	fun deleteAdminsInTestTransaction() {
		appAdminRepository.deleteAllInBatch()
	}

	@Test
	fun `어드민이 없으면 설정값으로 첫 어드민을 만들고 비밀번호는 해시로 저장한다`() {
		initialAdminService.createIfAbsent(InitialAdminProperties(" New-Admin@Test.LOCAL ", NEW_PASSWORD, NEW_NAME))
		clearPersistenceContext()

		val admins = appAdminRepository.findAll()
		assertThat(admins).hasSize(1)
		val admin = admins.first()
		assertThat(admin.loginId).isEqualTo("new-admin@test.local")
		assertThat(admin.name).isEqualTo(NEW_NAME)
		assertThat(admin.passwordHash).startsWith("{bcrypt}")
		assertThat(passwordEncoder.matches(NEW_PASSWORD, admin.passwordHash)).isTrue()
	}

	@Test
	fun `어드민이 하나라도 있으면 새로 만들지 않는다`() {
		val existing = saveAdmin("existing@test.local")

		initialAdminService.createIfAbsent(InitialAdminProperties("new-admin@test.local", NEW_PASSWORD, NEW_NAME))
		clearPersistenceContext()

		assertThat(appAdminRepository.findAll().map { it.id }).containsExactly(existing.id)
	}

	@Test
	fun `같은 로그인 아이디의 어드민이 있어도 이름과 비밀번호를 바꾸지 않는다`() {
		val existing = saveAdmin("new-admin@test.local")

		initialAdminService.createIfAbsent(InitialAdminProperties("New-Admin@Test.local", NEW_PASSWORD, NEW_NAME))
		clearPersistenceContext()

		val admin = appAdminRepository.findAll().single()
		assertThat(admin.id).isEqualTo(existing.id)
		assertThat(admin.name).isEqualTo(EXISTING_NAME)
		assertThat(admin.passwordHash).isEqualTo(existing.passwordHash)
	}

	@Test
	fun `시작 시 실행되는 러너는 application_properties의 설정값으로 첫 어드민을 만든다`() {
		initialAdminRunner.run(DefaultApplicationArguments())
		clearPersistenceContext()

		val admin = appAdminRepository.findByLoginId(LoginId.normalize(initialAdminProperties.loginId))
		assertThat(admin).isNotNull()
		assertThat(admin!!.name).isEqualTo(initialAdminProperties.name)
		assertThat(passwordEncoder.matches(initialAdminProperties.password, admin.passwordHash)).isTrue()
	}

	private fun saveAdmin(loginId: String): AppAdmin =
		appAdminRepository.saveAndFlush(AppAdmin(loginId, checkNotNull(passwordEncoder.encode(EXISTING_PASSWORD)), EXISTING_NAME))

	private fun clearPersistenceContext() {
		entityManager.flush()
		entityManager.clear()
	}

	companion object {
		private const val NEW_PASSWORD = "new-password"
		private const val NEW_NAME = "새 어드민"
		private const val EXISTING_PASSWORD = "existing-password"
		private const val EXISTING_NAME = "기존 어드민"
	}
}
