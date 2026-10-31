package com.marco.assignment.handys.urbanstay.stay.repository

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
class StayAmountMigrationTest {

	@Autowired
	private lateinit var dataSource: DataSource

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val schema = "stay_amount_migration_${UUID.randomUUID().toString().take(8)}"

	@Test
	fun `예약 비용 마이그레이션은 기존 이용을 객실 유형의 1박 요금과 박 수로 계산한 금액(할인 0)으로 채운다`() {
		try {
			flyway(BEFORE_AMOUNT_VERSION).migrate()
			INSERTS.forEach { jdbcTemplate.update(it.replace(SCHEMA, schema)) }

			flyway(AMOUNT_VERSION).migrate()

			assertThat(jdbcTemplate.query(SELECT_AMOUNTS.replace(SCHEMA, schema)) { rs, _ -> (1..5).map { rs.getInt(it) } }).containsExactly(
				listOf(80000, 2, 160000, 0, 160000),
				listOf(150000, 3, 450000, 0, 450000),
			)
		} finally {
			flyway(AMOUNT_VERSION).clean()
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
		private const val BEFORE_AMOUNT_VERSION = "11"
		private const val AMOUNT_VERSION = "12"
		private const val SCHEMA = "{schema}"
		private val INSERTS = listOf(
			"""
			insert into {schema}.hotel (id, name, address, phone, version, created_at, updated_at)
			values (1, '어반스테이', '서울', '02-1234-5678', 0, now(), now())
			""",
			"""
			insert into {schema}.room_type (id, hotel_id, name, capacity, room_rate, check_in_time, check_out_time, version, created_at, updated_at)
			values (1, 1, '스탠다드', 2, 80000, '15:00', '11:00', 0, now(), now()), (2, 1, '디럭스', 4, 150000, '15:00', '11:00', 0, now(), now())
			""",
			"""
			insert into {schema}.room (id, hotel_id, name, room_type_id, status, version, created_at, updated_at)
			values (1, 1, '101', 1, 'VACANT', 0, now(), now()), (2, 1, '201', 2, 'VACANT', 0, now(), now())
			""",
			"""
			insert into {schema}.guest (id, hotel_id, name, phone, email, version, created_at, updated_at)
			values (1, 1, '홍길동', '010-1234-5678', 'guest@example.com', 0, now(), now())
			""",
			"""
			insert into {schema}.stay (room_id, guest_id, check_in_date, check_out_date, guest_count, created_at, updated_at)
			values (1, 1, '2026-11-01', '2026-11-03', 2, now(), now()), (2, 1, '2026-11-01', '2026-11-04', 2, now(), now())
			""",
		)
		private const val SELECT_AMOUNTS = """
			select room_rate, nights, base_amount, discount_amount, total_amount from {schema}.stay order by room_id
		"""
	}
}
