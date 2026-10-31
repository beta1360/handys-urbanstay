package com.marco.assignment.handys.urbanstay.common.entity

import com.marco.assignment.handys.fixture.AuditingTestEntity
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.UrbanstayApplication
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager
import org.springframework.boot.persistence.autoconfigure.EntityScan
import org.springframework.context.annotation.Import
import org.springframework.data.auditing.AuditingHandler
import org.springframework.data.auditing.DateTimeProvider
import java.time.Instant
import java.util.Optional

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
@EntityScan(basePackageClasses = [UrbanstayApplication::class, AuditingTestEntity::class])
class BaseEntityTest {

	@Autowired
	private lateinit var entityManager: TestEntityManager

	@Autowired
	private lateinit var auditingHandler: AuditingHandler

	@Autowired
	private lateinit var dateTimeProvider: DateTimeProvider

	private var now: Instant = CREATED_AT

	@BeforeEach
	fun useFixedTime() {
		auditingHandler.setDateTimeProvider { Optional.of(now) }
	}

	@AfterEach
	fun restoreTime() {
		auditingHandler.setDateTimeProvider(dateTimeProvider)
	}

	@Test
	fun `저장하면 id와 생성 시각, 수정 시각이 채워진다`() {
		val saved = entityManager.persistFlushFind(AuditingTestEntity("before"))

		assertThat(saved.id).isNotNull()
		assertThat(saved.createdAt).isEqualTo(CREATED_AT)
		assertThat(saved.updatedAt).isEqualTo(CREATED_AT)
	}

	@Test
	fun `수정하면 수정 시각만 바뀌고 생성 시각은 유지된다`() {
		val saved = entityManager.persistFlushFind(AuditingTestEntity("before"))

		now = UPDATED_AT
		saved.name = "after"
		entityManager.flush()

		val updated = entityManager.refresh(saved)
		assertThat(updated.name).isEqualTo("after")
		assertThat(updated.createdAt).isEqualTo(CREATED_AT)
		assertThat(updated.updatedAt).isEqualTo(UPDATED_AT)
	}

	companion object {
		private val CREATED_AT = Instant.parse("2026-01-01T00:00:00Z")
		private val UPDATED_AT = Instant.parse("2026-01-01T00:00:01Z")
	}
}
