package com.marco.assignment.handys.urbanstay.guest.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.ValueSource
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
class GuestRepositoryTest {

	@Autowired
	private lateinit var guestRepository: GuestRepository

	@Autowired
	private lateinit var entityManager: TestEntityManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	private lateinit var otherHotel: Hotel

	@BeforeEach
	fun saveHotels() {
		hotel = entityManager.persistAndFlush(Hotel("어반스테이 $suffix", "서울 $suffix", HOTEL_PHONE, null))
		otherHotel = entityManager.persistAndFlush(Hotel("어반스테이 $suffix", "부산 $suffix", HOTEL_PHONE, null))
	}

	@Test
	fun `이름, 전화번호, 이메일은 앞뒤 공백만 지우고 입력한 모양과 대소문자 그대로 저장한다`() {
		val saved = guestRepository.saveAndFlush(Guest(hotel, " 홍길동\t", " 010-1234-5678\n", " Hong.GilDong@Example.COM "))
		entityManager.clear()

		val found = guestRepository.findById(checkNotNull(saved.id)).orElseThrow()
		assertThat(listOf(found.hotel.id, found.name, found.phone, found.email))
			.containsExactly(hotel.id, "홍길동", "010-1234-5678", "Hong.GilDong@Example.COM")
	}

	@Test
	fun `등록한 이용객의 version은 0이고 값이 바뀌어 저장될 때만 1씩 커진다`() {
		val guest = guestRepository.saveAndFlush(guest(hotel, PHONE))
		assertThat(guest.version).isZero()

		guest.update("김철수", PHONE, EMAIL)
		guestRepository.flush()
		assertThat(guest.version).isEqualTo(1)

		guest.update(" 김철수 ", " $PHONE", "$EMAIL ")
		guestRepository.flush()
		entityManager.clear()
		assertThat(guestRepository.findById(checkNotNull(guest.id)).orElseThrow().version).isEqualTo(1)
	}

	@ParameterizedTest
	@ValueSource(strings = [" 010-1234-5678 ", "01012345678", "010-12345678", "-010--1234-5678-"])
	fun `같은 호텔에 하이픈을 뺀 숫자가 같은 전화번호는 이름 있는 DB 유일 인덱스가 저장을 막는다`(phone: String) {
		guestRepository.saveAndFlush(guest(hotel, PHONE))

		assertThatThrownBy { guestRepository.saveAndFlush(Guest(hotel, "다른 사람", phone, "other@example.com")) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(Guest.HOTEL_PHONE_UNIQUE_CONSTRAINT)).isTrue()
			}
	}

	@Test
	fun `다른 호텔과는 전화번호가 같아도 되고 이메일과 이름은 같은 호텔에서도 같아도 된다`() {
		guestRepository.saveAndFlush(guest(hotel, PHONE))
		guestRepository.saveAndFlush(guest(otherHotel, "01012345678"))
		guestRepository.saveAndFlush(guest(hotel, OTHER_PHONE))

		val saved = guestRepository.findAll().filter { it.hotel.id in setOf(hotel.id, otherHotel.id) }.map { Triple(it.hotel.id, it.phone, it.email) }
		assertThat(saved)
			.containsExactlyInAnyOrder(Triple(hotel.id, PHONE, EMAIL), Triple(otherHotel.id, "01012345678", EMAIL), Triple(hotel.id, OTHER_PHONE, EMAIL))
	}

	@Test
	fun `다른 제약 위반은 호텔과 전화번호의 유일 제약 위반으로 보지 않는다`() {
		assertThatThrownBy { guestRepository.saveAndFlush(Guest(hotel, NAME, "1234567", EMAIL)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates("guest_phone_check")).isTrue()
				assertThat(it.violates(Guest.HOTEL_PHONE_UNIQUE_CONSTRAINT)).isFalse()
			}
	}

	@ParameterizedTest
	@CsvSource(
		"name, '', guest_name_check",
		"name, ' 홍길동', guest_name_check",
		"name, '홍길동 ', guest_name_check",
		"phone, '', guest_phone_check",
		"phone, ' 010-1234-5678', guest_phone_check",
		"phone, '010 1234 5678', guest_phone_check",
		"phone, '+82-10-1234-5678', guest_phone_check",
		"phone, '1234567', guest_phone_check",
		"phone, '123456789012', guest_phone_check",
		"phone, '--------', guest_phone_check",
		"email, '', guest_email_check",
		"email, ' guest@example.com', guest_email_check",
		"email, 'guest@example.com ', guest_email_check",
	)
	fun `규칙에 맞지 않는 값은 DB CHECK 제약이 저장을 막는다`(column: String, value: String, constraint: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf(column to value)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining(constraint)
	}

	@ParameterizedTest
	@ValueSource(strings = ["12345678", "010-1234-5678", "01012345678", "02--1234-5678", "-0-1-2-3-4-5-6-7-"])
	fun `숫자와 -만 있고 숫자가 8~11개인 전화번호는 DB CHECK 제약을 통과한다`(phone: String) {
		insertWithoutEntity(mapOf("phone" to phone))

		assertThat(guestRepository.findAll().filter { it.hotel.id == hotel.id }.map { it.phone }).containsExactly(phone)
	}

	@Test
	fun `없는 호텔의 이용객은 외래 키 제약이 저장을 막는다`() {
		assertThatThrownBy { insertWithoutEntity(mapOf("hotel_id" to Long.MAX_VALUE)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("guest_hotel_id_fkey")
	}

	@Test
	fun `전화번호 중복 확인은 같은 호텔에서 하이픈을 뺀 숫자로 비교하고 수정할 때는 자기 자신을 뺀다`() {
		val guest = guestRepository.saveAndFlush(guest(hotel, PHONE))

		assertThat(samePhone(hotel, " 01012345678 ", null)).isTrue()
		assertThat(samePhone(hotel, "010-1234-5679", null)).isFalse()
		assertThat(samePhone(otherHotel, PHONE, null)).isFalse()
		assertThat(samePhone(hotel, "0101-234-5678", checkNotNull(guest.id))).isFalse()
		assertThat(samePhone(hotel, PHONE, Long.MAX_VALUE)).isTrue()
	}

	@Test
	fun `id와 호텔이 모두 맞을 때만 이용객을 찾는다`() {
		val guest = guestRepository.saveAndFlush(guest(hotel, PHONE))

		assertThat(guestRepository.findByIdAndHotelId(checkNotNull(guest.id), checkNotNull(hotel.id))?.id).isEqualTo(guest.id)
		assertThat(guestRepository.findByIdAndHotelId(guest.id!!, checkNotNull(otherHotel.id))).isNull()
	}

	@Test
	fun `검색어 없이 찾으면 그 호텔의 이용객만 나온다`() {
		val first = guestRepository.saveAndFlush(guest(hotel, PHONE))
		val second = guestRepository.saveAndFlush(guest(hotel, OTHER_PHONE))
		guestRepository.saveAndFlush(guest(otherHotel, PHONE))

		assertThat(search(null)).containsExactly(second.id, first.id)
	}

	@Test
	fun `검색어가 이름에 들어 있으면 대소문자 구분 없이, 전화번호에 들어 있으면 양쪽 하이픈을 빼고 찾는다`() {
		val byName = guestRepository.saveAndFlush(guest(hotel, "010-0000-0001", "Kim 1234"))
		val dashed = guestRepository.saveAndFlush(guest(hotel, "010-1234-5678"))
		val plain = guestRepository.saveAndFlush(guest(hotel, "01099991234"))
		guestRepository.saveAndFlush(guest(hotel, "010-5555-6666", "이영희"))
		guestRepository.saveAndFlush(guest(otherHotel, "010-1234-0000", "KIM 1234"))

		assertThat(search("1234")).containsExactly(plain.id, dashed.id, byName.id)
		assertThat(search("kIm")).containsExactly(byName.id)
		assertThat(search("01012345678")).containsExactly(dashed.id)
		assertThat(search("9-1234")).containsExactly(plain.id)
		assertThat(search("없는 검색어")).isEmpty()
	}

	@Test
	fun `하이픈만 있는 검색어는 전화번호로 거르지 않고 이름에서만 찾는다`() {
		val hyphenName = guestRepository.saveAndFlush(guest(hotel, PHONE, "김-철수"))
		guestRepository.saveAndFlush(guest(hotel, OTHER_PHONE))

		assertThat(search("-")).containsExactly(hyphenName.id)
	}

	@ParameterizedTest
	@CsvSource("'50%', '50원'", "'a_b', 'axb'", "'c\\d', 'cd'")
	fun `검색어의 퍼센트, 밑줄, 역슬래시는 와일드카드가 아니라 글자 그대로 찾는다`(literal: String, decoy: String) {
		val target = guestRepository.saveAndFlush(guest(hotel, PHONE, "이용객 $literal"))
		guestRepository.saveAndFlush(guest(hotel, OTHER_PHONE, "이용객 $decoy"))

		assertThat(search(literal)).containsExactly(target.id)
	}

	private fun samePhone(hotel: Hotel, phone: String, excludedId: Long?): Boolean =
		guestRepository.exists(GuestSpecifications.samePhone(checkNotNull(hotel.id), phone, excludedId))

	private fun search(keyword: String?): List<Long?> =
		guestRepository.findAll(GuestSpecifications.search(checkNotNull(hotel.id), keyword), NEWEST_FIRST).content.map { it.id }

	private fun guest(hotel: Hotel, phone: String, name: String = NAME): Guest = Guest(hotel, name, phone, EMAIL)

	private fun insertWithoutEntity(overrides: Map<String, Any?>) {
		val values = mapOf("hotel_id" to checkNotNull(hotel.id), "name" to NAME, "phone" to PHONE, "email" to EMAIL) + overrides
		jdbcTemplate.update(INSERT_GUEST, values["hotel_id"], values["name"], values["phone"], values["email"])
	}

	companion object {
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val NAME = "홍길동"
		private const val PHONE = "010-1234-5678"
		private const val OTHER_PHONE = "010-8765-4321"
		private const val EMAIL = "guest@example.com"
		private val NEWEST_FIRST = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "id"))
		private const val INSERT_GUEST =
			"insert into guest (hotel_id, name, phone, email, version, created_at, updated_at) values (?, ?, ?, ?, 0, now(), now())"
	}
}
