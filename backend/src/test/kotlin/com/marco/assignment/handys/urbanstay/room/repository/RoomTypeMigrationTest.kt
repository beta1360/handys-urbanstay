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
class RoomTypeMigrationTest {

	@Autowired
	private lateinit var dataSource: DataSource

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val schema = "room_type_migration_${UUID.randomUUID().toString().take(8)}"

	@Test
	fun `객실 유형 마이그레이션은 호텔마다 유형 글자값별로 유형을 만들어 객실에 연결하고 객실의 유형·인원·시각 컬럼을 지운다`() {
		try {
			flyway(BEFORE_ROOM_TYPE_VERSION).migrate()
			INSERTS.forEach { jdbcTemplate.update(it.replace(SCHEMA, schema)) }

			flyway(ROOM_TYPE_VERSION).migrate()

			assertThat(jdbcTemplate.query(SELECT_ROOMS.replace(SCHEMA, schema)) { rs, _ -> (1..8).map { rs.getString(it) } }).containsExactly(
				listOf("1", "101", "1", "스탠다드", "4", "100000", "15:00:00", "11:00:00"),
				listOf("1", "102", "1", "스탠다드", "4", "100000", "15:00:00", "11:00:00"),
				listOf("1", "201", "1", "디럭스", "3", "100000", "14:00:00", "10:00:00"),
				listOf("1", "202", "1", "deluxe", "2", "100000", "13:00:00", "09:00:00"),
				listOf("2", "101", "2", "스탠다드", "2", "100000", "12:00:00", "08:00:00"),
			)
			assertThat(jdbcTemplate.queryForObject(COUNT_ROOM_TYPES.replace(SCHEMA, schema), Int::class.java)).isEqualTo(4)
			assertThat(jdbcTemplate.queryForList(REMOVED_COLUMNS, String::class.java, schema)).isEmpty()
		} finally {
			flyway(ROOM_TYPE_VERSION).clean()
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
		private const val BEFORE_ROOM_TYPE_VERSION = "10"
		private const val ROOM_TYPE_VERSION = "11"
		private const val SCHEMA = "{schema}"
		private val INSERTS = listOf(
			"""
			insert into {schema}.hotel (id, name, address, phone, version, created_at, updated_at)
			values (1, '어반스테이', '서울', '02-1234-5678', 0, now(), now()), (2, '어반스테이', '부산', '02-1234-5678', 0, now(), now())
			""",
			"""
			insert into {schema}.room (hotel_id, name, type, capacity, check_in_time, check_out_time, status, version, created_at, updated_at)
			values
				(1, '101', '스탠다드', 2, '15:00', '11:00', 'VACANT', 0, now(), now()),
				(1, '102', '스탠다드', 4, '16:00', '12:00', 'VACANT', 0, now(), now()),
				(1, '201', '디럭스', 3, '14:00', '10:00', 'VACANT', 0, now(), now()),
				(1, '202', 'deluxe', 2, '13:00', '09:00', 'VACANT', 0, now(), now()),
				(2, '101', '스탠다드', 2, '12:00', '08:00', 'VACANT', 0, now(), now())
			""",
		)
		private const val SELECT_ROOMS = """
			select r.hotel_id, r.name, t.hotel_id, t.name, t.capacity, t.room_rate, t.check_in_time, t.check_out_time
			from {schema}.room r join {schema}.room_type t on t.id = r.room_type_id
			order by r.hotel_id, r.name
		"""
		private const val COUNT_ROOM_TYPES = "select count(*) from {schema}.room_type"
		private const val REMOVED_COLUMNS = """
			select column_name from information_schema.columns
			where table_schema = ? and table_name = 'room' and column_name in ('type', 'capacity', 'check_in_time', 'check_out_time')
		"""
	}
}
