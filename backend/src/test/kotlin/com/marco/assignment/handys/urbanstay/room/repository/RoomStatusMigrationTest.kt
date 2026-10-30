package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import org.assertj.core.api.Assertions.assertThat
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.util.UUID
import javax.sql.DataSource

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RoomStatusMigrationTest {

	@Autowired
	private lateinit var dataSource: DataSource

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val schema = "room_status_migration_${UUID.randomUUID().toString().take(8)}"

	@Test
	fun `상태 컬럼을 더하는 마이그레이션은 기존 객실을 VACANT로 채우고 이력은 남기지 않는다`() {
		try {
			flyway(BEFORE_STATUS_VERSION).migrate()
			jdbcTemplate.update(INSERT_HOTEL.replace(SCHEMA, schema))
			jdbcTemplate.update(INSERT_ROOMS.replace(SCHEMA, schema))

			flyway(STATUS_VERSION).migrate()

			assertThat(jdbcTemplate.queryForList(SELECT_ROOM_STATUSES.replace(SCHEMA, schema), String::class.java))
				.containsExactly("VACANT", "VACANT")
			assertThat(jdbcTemplate.queryForObject(COUNT_HISTORIES.replace(SCHEMA, schema), Int::class.java)).isZero()
		} finally {
			flyway(STATUS_VERSION).clean()
		}
	}

	private fun flyway(target: String): Flyway =
		Flyway.configure()
			.dataSource(dataSource)
			.schemas(schema)
			.locations(MIGRATION_LOCATION)
			.target(target)
			.cleanDisabled(false)
			.load()

	companion object {
		private const val MIGRATION_LOCATION = "classpath:db/migration"
		private const val BEFORE_STATUS_VERSION = "6"
		private const val STATUS_VERSION = "7"
		private const val SCHEMA = "{schema}"
		private const val INSERT_HOTEL = """
			insert into {schema}.hotel (id, name, address, phone, version, created_at, updated_at)
			values (1, '어반스테이', '서울', '02-1234-5678', 0, now(), now())
		"""
		private const val INSERT_ROOMS = """
			insert into {schema}.room (hotel_id, name, type, capacity, check_in_time, check_out_time, version, created_at, updated_at)
			values (1, '101', '스탠다드', 2, '15:00', '11:00', 0, now(), now()), (1, '102', '스탠다드', 2, '15:00', '11:00', 0, now(), now())
		"""
		private const val SELECT_ROOM_STATUSES = "select status from {schema}.room order by name"
		private const val COUNT_HISTORIES = "select count(*) from {schema}.room_status_history"
	}
}
