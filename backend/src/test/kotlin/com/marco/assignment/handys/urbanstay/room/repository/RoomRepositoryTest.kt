package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.jdbc.core.JdbcTemplate
import java.time.Instant
import java.time.LocalTime
import java.util.UUID

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
class RoomRepositoryTest {

	@Autowired
	private lateinit var roomRepository: RoomRepository

	@Autowired
	private lateinit var entityManager: TestEntityManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	private lateinit var otherHotel: Hotel

	@BeforeEach
	fun saveHotels() {
		hotel = entityManager.persistAndFlush(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null))
		otherHotel = entityManager.persistAndFlush(Hotel("어반스테이 $suffix", "부산 $suffix", PHONE, null))
	}

	@Test
	fun `문자열은 앞뒤 공백을 지워 저장하고 공백만 있는 소개는 null로, 시각은 분 단위로 저장한다`() {
		val saved = roomRepository.saveAndFlush(
			Room(hotel, " 101\t", "\n스탠다드 ", 2, null, " 　 ", LocalTime.of(15, 0, 30), LocalTime.of(11, 0, 0, 500)),
		)
		entityManager.clear()

		val found = roomRepository.findById(checkNotNull(saved.id)).orElseThrow()
		assertThat(listOf(found.hotel.id, found.name, found.type, found.capacity, found.floor, found.description, found.checkInTime, found.checkOutTime))
			.containsExactly(hotel.id, "101", "스탠다드", 2, null, null, LocalTime.of(15, 0), LocalTime.of(11, 0))
	}

	@Test
	fun `등록한 객실의 version은 0이고 값이 바뀌어 저장될 때만 1씩 커진다`() {
		val room = roomRepository.saveAndFlush(room(hotel, NAME))
		assertThat(room.version).isZero()

		room.update(NAME, TYPE, 4, -1, DESCRIPTION, CHECK_IN, CHECK_OUT)
		roomRepository.flush()
		assertThat(room.version).isEqualTo(1)

		room.update(" $NAME ", TYPE, 4, -1, " $DESCRIPTION ", CHECK_IN.plusSeconds(30), CHECK_OUT)
		roomRepository.flush()
		entityManager.clear()
		assertThat(roomRepository.findById(checkNotNull(room.id)).orElseThrow().version).isEqualTo(1)
	}

	@Test
	fun `같은 호텔에 이름이 같은 객실은 이름 있는 DB 유일 제약이 저장을 막는다`() {
		roomRepository.saveAndFlush(room(hotel, NAME))

		assertThatThrownBy { roomRepository.saveAndFlush(Room(hotel, " $NAME ", "디럭스", 4, 3, DESCRIPTION, CHECK_OUT, CHECK_IN)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(Room.HOTEL_NAME_UNIQUE_CONSTRAINT)).isTrue()
			}
	}

	@Test
	fun `다른 호텔과는 이름이 같아도 되고 대소문자만 다른 이름은 다른 객실로 저장한다`() {
		roomRepository.saveAndFlush(room(hotel, "Suite A"))
		roomRepository.saveAndFlush(room(otherHotel, "Suite A"))
		roomRepository.saveAndFlush(room(hotel, "SUITE A"))

		val names = roomRepository.findAll().filter { it.hotel.id in setOf(hotel.id, otherHotel.id) }.map { it.hotel.id to it.name }
		assertThat(names).containsExactlyInAnyOrder(hotel.id to "Suite A", otherHotel.id to "Suite A", hotel.id to "SUITE A")
	}

	@Test
	fun `다른 제약 위반은 호텔과 이름의 유일 제약 위반으로 보지 않는다`() {
		assertThatThrownBy { roomRepository.saveAndFlush(Room(hotel, NAME, TYPE, 0, null, null, CHECK_IN, CHECK_OUT)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates("room_capacity_check")).isTrue()
				assertThat(it.violates(Room.HOTEL_NAME_UNIQUE_CONSTRAINT)).isFalse()
			}
	}

	@ParameterizedTest
	@CsvSource(
		"name, '', room_name_check",
		"name, ' 101', room_name_check",
		"name, '101 ', room_name_check",
		"type, '', room_type_check",
		"type, ' 디럭스', room_type_check",
		"type, '디럭스 ', room_type_check",
		"capacity, 0, room_capacity_check",
		"capacity, 21, room_capacity_check",
		"floor, -11, room_floor_check",
		"floor, 201, room_floor_check",
		"description, '', room_description_check",
		"description, '소개 ', room_description_check",
		"description, ' 소개', room_description_check",
		"check_in_time, '15:00:30', room_check_in_time_check",
		"check_in_time, '15:00:00.5', room_check_in_time_check",
		"check_out_time, '11:00:01', room_check_out_time_check",
		"check_out_time, '11:00:00.000001', room_check_out_time_check",
	)
	fun `규칙에 맞지 않는 값은 DB CHECK 제약이 저장을 막는다`(column: String, value: String, constraint: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf(column to value)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining(constraint)
	}

	@ParameterizedTest
	@CsvSource("''", "vacant", "Vacant", "CLEANING", "' VACANT'")
	fun `상태 컬럼은 네 상태 이름이 아닌 값을 DB CHECK 제약으로 막는다`(status: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf("status" to status)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("room_status_check")
	}

	@Test
	fun `상태 컬럼은 null을 받지 않는다`() {
		assertThatThrownBy { insertWithoutEntity(mapOf("status" to null)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("status")
	}

	@ParameterizedTest
	@EnumSource(RoomStatus::class)
	fun `상태 컬럼은 네 상태 이름을 받는다`(status: RoomStatus) {
		insertWithoutEntity(mapOf("status" to status.name))

		assertThat(roomRepository.findAll().filter { it.hotel.id == hotel.id }.map { it.status }).containsExactly(status)
	}

	@Test
	fun `새 객실은 VACANT로 저장된다`() {
		val saved = roomRepository.saveAndFlush(room(hotel, NAME))
		entityManager.clear()

		assertThat(saved.status).isEqualTo(RoomStatus.VACANT)
		assertThat(jdbcTemplate.queryForObject(SELECT_STATUS, String::class.java, saved.id)).isEqualTo("VACANT")
	}

	@Test
	fun `엔티티를 수정해 저장해도 상태 컬럼은 UPDATE하지 않아 그사이 바뀐 상태를 덮어쓰지 않는다`() {
		val room = roomRepository.saveAndFlush(room(hotel, NAME))
		jdbcTemplate.update(UPDATE_STATUS, RoomStatus.RESERVED.name, room.id)

		room.update(NAME, "디럭스", 4, null, null, CHECK_IN, CHECK_OUT)
		roomRepository.flush()

		assertThat(room.status).isEqualTo(RoomStatus.VACANT)
		assertThat(jdbcTemplate.queryForMap(SELECT_STATUS_TYPE_VERSION, room.id))
			.containsExactlyInAnyOrderEntriesOf(mapOf("status" to "RESERVED", "type" to "디럭스", "version" to 1L))
	}

	@Test
	fun `지금 상태가 from일 때만 같은 호텔의 객실 상태와 수정 시각을 바꾸고 바꾼 행 수 1을 돌려주며 version은 그대로다`() {
		val room = roomRepository.saveAndFlush(room(hotel, NAME))
		val updatedAt = Instant.parse("2026-10-30T06:59:32.123456Z")

		val updated = roomRepository.updateStatus(checkNotNull(room.id), checkNotNull(hotel.id), RoomStatus.VACANT, RoomStatus.RESERVED, updatedAt)

		assertThat(updated).isEqualTo(1)
		val found = roomRepository.findById(room.id!!).orElseThrow()
		assertThat(listOf(found.status, found.version, found.updatedAt)).containsExactly(RoomStatus.RESERVED, 0L, updatedAt)
	}

	@Test
	fun `지금 상태가 from과 다르거나 다른 호텔의 객실이면 바꾸지 않고 0을 돌려준다`() {
		val roomId = checkNotNull(roomRepository.saveAndFlush(room(hotel, NAME)).id)
		val before = jdbcTemplate.queryForMap(SELECT_STATUS_VERSION_UPDATED_AT, roomId)
		val updatedAt = Instant.parse("2026-10-30T06:59:32Z")

		val notCurrent = roomRepository.updateStatus(roomId, checkNotNull(hotel.id), RoomStatus.RESERVED, RoomStatus.OCCUPIED, updatedAt)
		val inOtherHotel = roomRepository.updateStatus(roomId, checkNotNull(otherHotel.id), RoomStatus.VACANT, RoomStatus.RESERVED, updatedAt)

		assertThat(listOf(notCurrent, inOtherHotel)).containsExactly(0, 0)
		assertThat(jdbcTemplate.queryForMap(SELECT_STATUS_VERSION_UPDATED_AT, roomId)).isEqualTo(before)
		assertThat(before["status"]).isEqualTo("VACANT")
	}

	@ParameterizedTest
	@CsvSource(
		"capacity, 1",
		"capacity, 20",
		"floor, -10",
		"floor, 200",
		"floor, ",
		"description, ",
		"check_in_time, '00:00'",
		"check_out_time, '23:59'",
	)
	fun `범위 끝 값과 선택 항목의 null은 DB 제약을 통과한다`(column: String, value: String?) {
		insertWithoutEntity(mapOf(column to value))

		assertThat(roomRepository.findAll().filter { it.hotel.id == hotel.id }.map { it.name }).containsExactly(NAME)
	}

	@Test
	fun `없는 호텔의 객실은 외래 키 제약이 저장을 막는다`() {
		assertThatThrownBy { insertWithoutEntity(mapOf("hotel_id" to Long.MAX_VALUE)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("room_hotel_id_fkey")
	}

	@Test
	fun `이름 컬럼은 숫자를 숫자로 비교하는 결정적 ICU collation이라 같은 이름은 글자 그대로 비교한다`() {
		val collation = jdbcTemplate.queryForMap(NAME_COLLATION)

		assertThat(collation).containsExactlyInAnyOrderEntriesOf(
			mapOf("collation_name" to "natural_sort", "collprovider" to "i", "colllocale" to "und-u-kn", "collisdeterministic" to true),
		)
	}

	@Test
	fun `시각 컬럼은 time, version은 호텔처럼 기본값 없는 bigint not null, 상태는 기본값 없는 문자열 not null이다`() {
		val columns = jdbcTemplate.query(COLUMNS) { rs, _ -> rs.getString(1) to rs.getString(2) }.toMap()

		assertThat(columns).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"check_in_time" to "time without time zone not null",
				"check_out_time" to "time without time zone not null",
				"version" to "bigint not null",
				"status" to "character varying not null",
			),
		)
	}

	@Test
	fun `호텔별 목록은 그 호텔의 객실만 이름 오름차순으로 찾고 숫자 이름은 숫자 크기 순이다`() {
		listOf("1001", "201", "99", "101").forEach { roomRepository.saveAndFlush(room(hotel, it)) }
		roomRepository.saveAndFlush(room(otherHotel, "100"))

		assertThat(roomRepository.findByHotelId(checkNotNull(hotel.id), FIRST_PAGE_BY_NAME).content.map { it.name })
			.containsExactly("99", "101", "201", "1001")
	}

	@Test
	fun `숫자, 영문, 한글이 섞인 이름은 이름 속 숫자를 숫자로 비교해 숫자, 영문, 한글 순이고 대소문자만 다르면 소문자가 먼저다`() {
		listOf("Deluxe", "스위트 A", "1001", "deluxe", "B동 101", "B동 99", "201", "101").forEach { roomRepository.saveAndFlush(room(hotel, it)) }

		assertThat(roomRepository.findByHotelId(checkNotNull(hotel.id), FIRST_PAGE_BY_NAME).content.map { it.name })
			.containsExactly("101", "201", "1001", "B동 99", "B동 101", "deluxe", "Deluxe", "스위트 A")
	}

	@Test
	fun `검색어가 이름에 들어 있는 그 호텔의 객실을 대소문자 구분 없이 이름 오름차순으로 찾는다`() {
		listOf("suite C", "디럭스", "SUITE A", "Suite B").forEach { roomRepository.saveAndFlush(room(hotel, it)) }
		roomRepository.saveAndFlush(room(otherHotel, "Suite Z"))

		assertThat(search("sUiTe")).containsExactly("SUITE A", "Suite B", "suite C")
		assertThat(search("없는 검색어")).isEmpty()
	}

	@ParameterizedTest
	@CsvSource("'50%', '50원'", "'a_b', 'axb'", "'c\\d', 'cd'")
	fun `검색어의 퍼센트, 밑줄, 역슬래시는 와일드카드가 아니라 글자 그대로 찾는다`(literal: String, decoy: String) {
		roomRepository.saveAndFlush(room(hotel, "객실 $literal"))
		roomRepository.saveAndFlush(room(hotel, "객실 $decoy"))

		assertThat(search(literal)).containsExactly("객실 $literal")
	}

	private fun search(keyword: String): List<String> =
		roomRepository.findByHotelIdAndNameContainingIgnoreCase(checkNotNull(hotel.id), keyword, FIRST_PAGE_BY_NAME).content.map { it.name }

	private fun room(hotel: Hotel, name: String): Room = Room(hotel, name, TYPE, 2, null, null, CHECK_IN, CHECK_OUT)

	private fun insertWithoutEntity(overrides: Map<String, Any?>) {
		val values = mapOf(
			"hotel_id" to checkNotNull(hotel.id),
			"name" to NAME,
			"type" to TYPE,
			"capacity" to "2",
			"floor" to "1",
			"description" to DESCRIPTION,
			"check_in_time" to "15:00",
			"check_out_time" to "11:00",
			"status" to RoomStatus.VACANT.name,
		) + overrides
		jdbcTemplate.update(
			INSERT_ROOM,
			values["hotel_id"],
			values["name"],
			values["type"],
			values["capacity"],
			values["floor"],
			values["description"],
			values["check_in_time"],
			values["check_out_time"],
			values["status"],
		)
	}

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val NAME = "101"
		private const val TYPE = "스탠다드"
		private const val DESCRIPTION = "창이 큰 객실"
		private val CHECK_IN: LocalTime = LocalTime.of(15, 0)
		private val CHECK_OUT: LocalTime = LocalTime.of(11, 0)
		private val FIRST_PAGE_BY_NAME = PageRequest.of(0, 100, Sort.by("name", "id"))
		private const val INSERT_ROOM = """
			insert into room (hotel_id, name, type, capacity, floor, description, check_in_time, check_out_time, status, version, created_at, updated_at)
			values (?, ?, ?, cast(? as integer), cast(? as integer), ?, cast(? as time), cast(? as time), ?, 0, now(), now())
		"""
		private const val SELECT_STATUS = "select status from room where id = ?"
		private const val UPDATE_STATUS = "update room set status = ? where id = ?"
		private const val SELECT_STATUS_TYPE_VERSION = "select status, type, version from room where id = ?"
		private const val SELECT_STATUS_VERSION_UPDATED_AT = "select status, version, updated_at from room where id = ?"
		private const val COLUMNS = """
			select column_name, concat_ws(' ', data_type, case when is_nullable = 'NO' then 'not null' end, 'default ' || column_default)
			from information_schema.columns
			where table_schema = 'public' and table_name = 'room' and column_name in ('check_in_time', 'check_out_time', 'version', 'status')
		"""
		private const val NAME_COLLATION = """
			select c.collation_name, p.collprovider, p.colllocale, p.collisdeterministic
			from information_schema.columns c
			join pg_collation p on p.collname = c.collation_name
			where c.table_schema = 'public' and c.table_name = 'room' and c.column_name = 'name'
		"""
	}
}
