package com.marco.assignment.handys.urbanstay.account.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
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
import org.springframework.jdbc.core.JdbcTemplate
import java.util.UUID

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
class HotelAdminRepositoryTest {

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

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
	fun `로그인 아이디는 앞뒤 공백을 지우고 소문자로, 이름은 앞뒤 공백을 지워 저장하고 활성 상태와 로그인 정보 버전 0으로 시작한다`() {
		val saved = hotelAdminRepository.saveAndFlush(HotelAdmin(hotel, " Master-$suffix@Test.LOCAL ", PASSWORD_HASH, " 홍길동\t", HotelAdminRole.MASTER))
		entityManager.clear()

		val found = hotelAdminRepository.findById(checkNotNull(saved.id)).orElseThrow()

		assertThat(listOf(found.loginId, found.name, found.role, found.active, found.credentialVersion, found.hotel.id))
			.containsExactly("master-$suffix@test.local", "홍길동", HotelAdminRole.MASTER, true, 0L, hotel.id)
	}

	@Test
	fun `호텔 계정의 version은 0에서 시작하고 컬럼은 호텔의 version처럼 기본값 없는 bigint not null이다`() {
		val saved = hotelAdminRepository.saveAndFlush(admin(hotel, "version-$suffix@test.local", HotelAdminRole.MASTER))
		entityManager.clear()

		val columns = jdbcTemplate.query(VERSION_COLUMNS) { rs, _ -> rs.getString(1) to rs.getString(2) }.toMap()

		assertThat(hotelAdminRepository.findById(checkNotNull(saved.id)).orElseThrow().version).isZero()
		assertThat(columns).containsExactlyInAnyOrderEntriesOf(mapOf("hotel" to "bigint not null", "hotel_admin" to "bigint not null"))
	}

	@Test
	fun `대소문자와 앞뒤 공백만 다른 로그인 아이디는 다른 호텔이어도 이름 있는 DB 유일 제약이 저장을 막는다`() {
		hotelAdminRepository.saveAndFlush(admin(hotel, "duplicate-$suffix@test.local", HotelAdminRole.MASTER))

		assertThatThrownBy { hotelAdminRepository.saveAndFlush(admin(otherHotel, " Duplicate-$suffix@TEST.local ", HotelAdminRole.OPERATOR)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(HotelAdmin.LOGIN_ID_UNIQUE_CONSTRAINT)).isTrue()
			}
	}

	@Test
	fun `한 호텔에 두 번째 마스터는 이름 있는 DB 유일 인덱스가 저장을 막는다`() {
		hotelAdminRepository.saveAndFlush(admin(hotel, "master-$suffix@test.local", HotelAdminRole.MASTER))

		assertThatThrownBy { hotelAdminRepository.saveAndFlush(admin(hotel, "second-master-$suffix@test.local", HotelAdminRole.MASTER)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(HotelAdmin.MASTER_UNIQUE_CONSTRAINT)).isTrue()
				assertThat(it.violates(HotelAdmin.LOGIN_ID_UNIQUE_CONSTRAINT)).isFalse()
			}
	}

	@Test
	fun `한 호텔에 마스터 하나와 운영자 여러 명을 둘 수 있고 다른 호텔은 자기 마스터를 둔다`() {
		hotelAdminRepository.saveAndFlush(admin(hotel, "master-$suffix@test.local", HotelAdminRole.MASTER))
		hotelAdminRepository.saveAndFlush(admin(hotel, "operator1-$suffix@test.local", HotelAdminRole.OPERATOR))
		hotelAdminRepository.saveAndFlush(admin(hotel, "operator2-$suffix@test.local", HotelAdminRole.OPERATOR))
		hotelAdminRepository.saveAndFlush(admin(otherHotel, "other-master-$suffix@test.local", HotelAdminRole.MASTER))

		val roles = hotelAdminRepository.findAll().filter { it.loginId.endsWith("$suffix@test.local") }.groupBy({ it.hotel.id }, { it.role })

		assertThat(roles[hotel.id]).containsExactlyInAnyOrder(HotelAdminRole.MASTER, HotelAdminRole.OPERATOR, HotelAdminRole.OPERATOR)
		assertThat(roles[otherHotel.id]).containsExactly(HotelAdminRole.MASTER)
	}

	@ParameterizedTest
	@CsvSource(
		"login_id, '', hotel_admin_login_id_check",
		"login_id, 'Upper@test.local', hotel_admin_login_id_check",
		"login_id, ' leading@test.local', hotel_admin_login_id_check",
		"login_id, 'trailing@test.local ', hotel_admin_login_id_check",
		"name, '', hotel_admin_name_check",
		"name, '   ', hotel_admin_name_check",
		"name, ' 홍길동', hotel_admin_name_check",
		"name, '홍길동 ', hotel_admin_name_check",
		"role, 'ADMIN', hotel_admin_role_check",
		"role, 'master', hotel_admin_role_check",
	)
	fun `규칙에 맞지 않는 값은 DB CHECK 제약이 저장을 막는다`(column: String, value: String, constraint: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf(column to value)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining(constraint)
	}

	@Test
	fun `없는 호텔의 계정은 외래 키 제약이 저장을 막는다`() {
		assertThatThrownBy { insertWithoutEntity(mapOf("hotel_id" to Long.MAX_VALUE)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("hotel_admin_hotel_id_fkey")
	}

	@Test
	fun `규칙에 맞는 값은 DB 제약을 통과한다`() {
		insertWithoutEntity(emptyMap())

		assertThat(hotelAdminRepository.findAll().map { it.loginId }).contains("insert-$suffix@test.local")
	}

	private fun admin(hotel: Hotel, loginId: String, role: HotelAdminRole): HotelAdmin =
		HotelAdmin(hotel, loginId, PASSWORD_HASH, NAME, role)

	private fun insertWithoutEntity(overrides: Map<String, Any>) {
		val values = mapOf("hotel_id" to checkNotNull(hotel.id), "login_id" to "insert-$suffix@test.local", "name" to NAME, "role" to "OPERATOR") + overrides
		jdbcTemplate.update(INSERT_HOTEL_ADMIN, values["hotel_id"], values["login_id"], PASSWORD_HASH, values["name"], values["role"])
	}

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val NAME = "홍길동"
		private const val INSERT_HOTEL_ADMIN = """
			insert into hotel_admin (hotel_id, login_id, password_hash, name, role, active, credential_version, version, created_at, updated_at)
			values (?, ?, ?, ?, ?, true, 0, 0, now(), now())
		"""
		private const val VERSION_COLUMNS = """
			select table_name, concat_ws(' ', data_type, case when is_nullable = 'NO' then 'not null' end, 'default ' || column_default)
			from information_schema.columns
			where table_schema = 'public' and table_name in ('hotel', 'hotel_admin') and column_name = 'version'
		"""
	}
}
