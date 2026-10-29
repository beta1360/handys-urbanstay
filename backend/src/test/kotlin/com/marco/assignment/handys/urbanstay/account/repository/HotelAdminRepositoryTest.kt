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
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
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
	fun `아이디나 이름이 바뀌어 저장될 때만 version이 1씩 커지고 로그인 정보 버전은 정규화한 아이디가 바뀔 때만 커진다`() {
		val hotelAdmin = hotelAdminRepository.saveAndFlush(admin(hotel, "before-$suffix@test.local", HotelAdminRole.MASTER))

		hotelAdmin.update(" BEFORE-$suffix@Test.local\t", " $NAME ")
		hotelAdminRepository.flush()
		assertThat(listOf(hotelAdmin.version, hotelAdmin.credentialVersion)).containsExactly(0L, 0L)

		hotelAdmin.update("before-$suffix@test.local", "새 이름")
		hotelAdminRepository.flush()
		assertThat(listOf(hotelAdmin.version, hotelAdmin.credentialVersion)).containsExactly(1L, 0L)

		hotelAdmin.update(" After-$suffix@test.local ", "새 이름")
		hotelAdminRepository.flush()
		entityManager.clear()

		val found = hotelAdminRepository.findById(checkNotNull(hotelAdmin.id)).orElseThrow()
		assertThat(listOf(found.loginId, found.name, found.version, found.credentialVersion))
			.containsExactly("after-$suffix@test.local", "새 이름", 2L, 1L)
	}

	@Test
	fun `비밀번호를 재설정하면 같은 해시여도 version과 로그인 정보 버전이 1씩 커진다`() {
		val hotelAdmin = hotelAdminRepository.saveAndFlush(admin(hotel, "reset-$suffix@test.local", HotelAdminRole.MASTER))

		hotelAdmin.resetPassword(PASSWORD_HASH)
		hotelAdminRepository.flush()
		hotelAdmin.resetPassword("new-password-hash")
		hotelAdminRepository.flush()
		entityManager.clear()

		val found = hotelAdminRepository.findById(checkNotNull(hotelAdmin.id)).orElseThrow()
		assertThat(listOf(found.passwordHash, found.version, found.credentialVersion)).containsExactly("new-password-hash", 2L, 2L)
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

	@Test
	fun `호텔별 계정 목록을 찾도록 hotel_id에 이름 있는 인덱스를 둔다`() {
		val definition = jdbcTemplate.queryForObject(INDEX_DEFINITION, String::class.java, "hotel_admin_hotel_id_idx")

		assertThat(definition).isEqualTo("CREATE INDEX hotel_admin_hotel_id_idx ON public.hotel_admin USING btree (hotel_id)")
	}

	@Test
	fun `계정 검색은 같은 호텔의 요청한 역할만 찾고 활성 여부를 주면 그 상태만 찾는다`() {
		val master = save(hotel, "master-$suffix@test.local", NAME, HotelAdminRole.MASTER)
		val active = save(hotel, "active-$suffix@test.local", NAME, HotelAdminRole.OPERATOR)
		val inactive = save(hotel, "inactive-$suffix@test.local", NAME, HotelAdminRole.OPERATOR)
		save(otherHotel, "other-$suffix@test.local", NAME, HotelAdminRole.OPERATOR)
		deactivate(inactive)

		assertThat(search(HotelAdminRole.OPERATOR, null, null)).containsExactly(inactive.id, active.id)
		assertThat(search(HotelAdminRole.OPERATOR, true, null)).containsExactly(active.id)
		assertThat(search(HotelAdminRole.OPERATOR, false, null)).containsExactly(inactive.id)
		assertThat(search(HotelAdminRole.MASTER, null, null)).containsExactly(master.id)
	}

	@Test
	fun `검색어가 이름이나 아이디에 들어 있는 계정을 대소문자 구분 없이 찾고 활성 여부와 함께 거른다`() {
		val byName = save(hotel, "first-$suffix@test.local", "Front Desk", HotelAdminRole.OPERATOR)
		val byLoginId = save(hotel, "front-$suffix@test.local", NAME, HotelAdminRole.OPERATOR)
		val inactive = save(hotel, "night-$suffix@test.local", "FRONT 야간", HotelAdminRole.OPERATOR)
		save(hotel, "clean-$suffix@test.local", "청소", HotelAdminRole.OPERATOR)
		save(hotel, "front-master-$suffix@test.local", "Front 마스터", HotelAdminRole.MASTER)
		save(otherHotel, "front-other-$suffix@test.local", "Front", HotelAdminRole.OPERATOR)
		deactivate(inactive)

		assertThat(search(HotelAdminRole.OPERATOR, null, "fRoNt")).containsExactly(inactive.id, byLoginId.id, byName.id)
		assertThat(search(HotelAdminRole.OPERATOR, true, "FRONT")).containsExactly(byLoginId.id, byName.id)
		assertThat(search(HotelAdminRole.OPERATOR, false, "front")).containsExactly(inactive.id)
		assertThat(search(HotelAdminRole.OPERATOR, null, "없는 검색어")).isEmpty()
	}

	@ParameterizedTest
	@CsvSource(
		"name, '50%', '50원'",
		"name, 'a_b', 'axb'",
		"name, 'c\\d', 'cd'",
		"loginId, '50%', '50x'",
		"loginId, 'a_b', 'axb'",
		"loginId, 'c\\d', 'cd'",
	)
	fun `검색어의 퍼센트, 밑줄, 역슬래시는 이름과 아이디 모두 와일드카드가 아니라 글자 그대로 찾는다`(field: String, literal: String, decoy: String) {
		val (target, _) = listOf(literal, decoy).mapIndexed { index, value ->
			if (field == "name") {
				save(hotel, "name-$index-$suffix@test.local", "$suffix $value", HotelAdminRole.OPERATOR)
			} else {
				save(hotel, "$value-$suffix@test.local", NAME, HotelAdminRole.OPERATOR)
			}
		}

		assertThat(search(HotelAdminRole.OPERATOR, null, literal)).containsExactly(target.id)
	}

	private fun save(hotel: Hotel, loginId: String, name: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.saveAndFlush(HotelAdmin(hotel, loginId, PASSWORD_HASH, name, role))

	private fun deactivate(hotelAdmin: HotelAdmin) {
		jdbcTemplate.update("update hotel_admin set active = false where id = ?", hotelAdmin.id)
		entityManager.clear()
	}

	private fun search(role: HotelAdminRole, active: Boolean?, keyword: String?): List<Long?> =
		hotelAdminRepository.findAll(
			HotelAdminSpecifications.search(checkNotNull(hotel.id), role, active, keyword),
			PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "id")),
		).content.map { it.id }

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
		private const val INDEX_DEFINITION = "select indexdef from pg_indexes where schemaname = 'public' and tablename = 'hotel_admin' and indexname = ?"
	}
}
