package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatusHistory
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.jdbc.core.JdbcTemplate
import java.time.LocalTime
import java.util.UUID

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
class RoomStatusHistoryRepositoryTest {

	@Autowired
	private lateinit var historyRepository: RoomStatusHistoryRepository

	@Autowired
	private lateinit var entityManager: TestEntityManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var room: Room

	private lateinit var otherRoom: Room

	private lateinit var hotelAdmin: HotelAdmin

	@BeforeEach
	fun saveRoomsAndHotelAdmin() {
		val hotel = entityManager.persistAndFlush(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null))
		room = entityManager.persistAndFlush(Room(hotel, "101", "스탠다드", 2, null, null, CHECK_IN, CHECK_OUT))
		otherRoom = entityManager.persistAndFlush(Room(hotel, "102", "스탠다드", 2, null, null, CHECK_IN, CHECK_OUT))
		hotelAdmin = entityManager.persistAndFlush(HotelAdmin(hotel, "master-$suffix@test.local", "password-hash", " 홍길동 ", HotelAdminRole.MASTER))
	}

	@Test
	fun `이력은 이전 상태, 바뀐 상태, 바꾼 계정과 그때의 이름을 저장하고 바꾼 시각은 생성 시각이다`() {
		val saved = historyRepository.saveAndFlush(RoomStatusHistory(room, null, RoomStatus.VACANT, hotelAdmin))
		entityManager.clear()

		val found = historyRepository.findById(checkNotNull(saved.id)).orElseThrow()
		assertThat(listOf(found.room.id, found.fromStatus, found.toStatus, found.changedBy.id, found.changedByName))
			.containsExactly(room.id, null, RoomStatus.VACANT, hotelAdmin.id, "홍길동")
		assertThat(found.createdAt).isEqualTo(found.updatedAt)
	}

	@ParameterizedTest
	@CsvSource(
		"from_status, '', room_status_history_from_status_check",
		"from_status, vacant, room_status_history_from_status_check",
		"from_status, CLEANING, room_status_history_from_status_check",
		"to_status, '', room_status_history_to_status_check",
		"to_status, Reserved, room_status_history_to_status_check",
		"to_status, CLEANING, room_status_history_to_status_check",
		"changed_by_name, '', room_status_history_changed_by_name_check",
		"changed_by_name, ' 홍길동', room_status_history_changed_by_name_check",
		"changed_by_name, '홍길동 ', room_status_history_changed_by_name_check",
	)
	fun `규칙에 맞지 않는 값은 DB CHECK 제약이 저장을 막는다`(column: String, value: String, constraint: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf(column to value)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining(constraint)
	}

	@ParameterizedTest
	@CsvSource("to_status", "changed_by_name", "room_id", "changed_by_id", "created_at")
	fun `이전 상태를 뺀 항목은 null을 받지 않는다`(column: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf(column to null)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("\"$column\"")
	}

	@Test
	fun `이전 상태는 null을 받고 이름은 호텔 계정 이름과 같은 50자까지 받는다`() {
		insertWithoutEntity(mapOf("from_status" to null, "changed_by_name" to "가".repeat(HotelAdmin.NAME_MAX_LENGTH)))

		assertThatThrownBy { insertWithoutEntity(mapOf("changed_by_name" to "가".repeat(HotelAdmin.NAME_MAX_LENGTH + 1))) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
	}

	@ParameterizedTest
	@CsvSource("room_id, room_status_history_room_id_fkey", "changed_by_id, room_status_history_changed_by_id_fkey")
	fun `없는 객실이나 호텔 계정의 이력은 외래 키 제약이 저장을 막는다`(column: String, constraint: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf(column to Long.MAX_VALUE)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining(constraint)
	}

	@Test
	fun `객실별 이력은 그 객실의 이력만 바꾼 시각 내림차순, 같으면 id 내림차순으로 찾는다`() {
		val oldest = insertWithoutEntity(mapOf("created_at" to "2026-10-30T00:00:00Z"))
		val sameTimeFirst = insertWithoutEntity(mapOf("created_at" to "2026-10-30T00:00:01.000001Z"))
		val sameTimeSecond = insertWithoutEntity(mapOf("created_at" to "2026-10-30T00:00:01.000001Z"))
		val newest = insertWithoutEntity(mapOf("created_at" to "2026-10-30T00:00:02Z"))
		insertWithoutEntity(mapOf("room_id" to checkNotNull(otherRoom.id), "created_at" to "2026-10-31T00:00:00Z"))

		val page = historyRepository.findByRoomId(checkNotNull(room.id), PageRequest.of(0, 10, NEWEST_FIRST))

		assertThat(page.content.map { it.id }).containsExactly(newest, sameTimeSecond, sameTimeFirst, oldest)
		assertThat(page.totalElements).isEqualTo(4)
		assertThat(historyRepository.findByRoomId(room.id!!, PageRequest.of(1, 3, NEWEST_FIRST)).content.map { it.id }).containsExactly(oldest)
	}

	@Test
	fun `객실별 최신순 조회에 맞는 인덱스가 있다`() {
		assertThat(jdbcTemplate.queryForObject(INDEX_DEFINITION, String::class.java, INDEX_NAME))
			.isEqualTo("CREATE INDEX $INDEX_NAME ON public.room_status_history USING btree (room_id, created_at DESC, id DESC)")
	}

	private fun insertWithoutEntity(overrides: Map<String, Any?>): Long {
		val values = mapOf(
			"room_id" to checkNotNull(room.id),
			"from_status" to RoomStatus.VACANT.name,
			"to_status" to RoomStatus.RESERVED.name,
			"changed_by_id" to checkNotNull(hotelAdmin.id),
			"changed_by_name" to "홍길동",
			"created_at" to "2026-10-30T00:00:00Z",
		) + overrides
		return checkNotNull(
			jdbcTemplate.queryForObject(
				INSERT_HISTORY,
				Long::class.java,
				values["room_id"],
				values["from_status"],
				values["to_status"],
				values["changed_by_id"],
				values["changed_by_name"],
				values["created_at"],
				values["created_at"],
			),
		)
	}

	companion object {
		private const val PHONE = "02-1234-5678"
		private val CHECK_IN: LocalTime = LocalTime.of(15, 0)
		private val CHECK_OUT: LocalTime = LocalTime.of(11, 0)
		private val NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
		private const val INDEX_NAME = "room_status_history_room_id_created_at_id_idx"
		private const val INSERT_HISTORY = """
			insert into room_status_history (room_id, from_status, to_status, changed_by_id, changed_by_name, created_at, updated_at)
			values (cast(? as bigint), ?, ?, cast(? as bigint), ?, cast(? as timestamptz), coalesce(cast(? as timestamptz), now()))
			returning id
		"""
		private const val INDEX_DEFINITION = "select indexdef from pg_indexes where schemaname = 'public' and indexname = ?"
	}
}
