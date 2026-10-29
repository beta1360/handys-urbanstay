package com.marco.assignment.handys.urbanstay.hotel.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import java.util.UUID

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
class HotelRepositoryTest {

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var entityManager: TestEntityManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)
	private val name = "어반스테이 $suffix"
	private val address = "서울특별시 강남구 테헤란로 $suffix"

	@Test
	fun `이름과 주소가 모두 같은 호텔은 이름 있는 DB 유일 제약이 저장을 막는다`() {
		hotelRepository.saveAndFlush(Hotel(name, address, PHONE, null))

		assertThatThrownBy { hotelRepository.saveAndFlush(Hotel(name, address, OTHER_PHONE, DESCRIPTION)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(Hotel.NAME_ADDRESS_UNIQUE_CONSTRAINT)).isTrue()
			}
	}

	@Test
	fun `이름이 같아도 주소가 다르면 다른 호텔로 저장한다`() {
		hotelRepository.saveAndFlush(Hotel(name, address, PHONE, null))
		hotelRepository.saveAndFlush(Hotel(name, "$address 2층", PHONE, null))

		assertThat(hotelRepository.findAll().filter { it.name == name }).hasSize(2)
	}

	@Test
	fun `대소문자만 다른 이름과 주소는 다른 호텔로 저장한다`() {
		hotelRepository.saveAndFlush(Hotel("Urbanstay $suffix", "Seoul $suffix", PHONE, null))
		hotelRepository.saveAndFlush(Hotel("URBANSTAY $suffix", "Seoul $suffix", PHONE, null))
		hotelRepository.saveAndFlush(Hotel("Urbanstay $suffix", "SEOUL $suffix", PHONE, null))

		assertThat(hotelRepository.findAll().filter { it.name.endsWith(suffix) }).hasSize(3)
	}

	@Test
	fun `다른 제약 위반은 이름과 주소의 유일 제약 위반으로 보지 않는다`() {
		assertThatThrownBy { hotelRepository.saveAndFlush(Hotel(name, address, "phone", null)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates("hotel_phone_check")).isTrue()
				assertThat(it.violates(Hotel.NAME_ADDRESS_UNIQUE_CONSTRAINT)).isFalse()
			}
	}

	@Test
	fun `값은 앞뒤 공백을 지워 저장하고 비어 있거나 공백만 있는 소개는 null로 저장한다`() {
		val hotel = hotelRepository.saveAndFlush(Hotel(" $name\t", "\n$address ", " $PHONE ", " 　 "))
		entityManager.clear()

		val found = hotelRepository.findById(checkNotNull(hotel.id)).orElseThrow()
		assertThat(listOf(found.name, found.address, found.phone, found.description)).containsExactly(name, address, PHONE, null)
	}

	@Test
	fun `등록한 호텔의 version은 0이고 값이 바뀌어 저장될 때만 1씩 커진다`() {
		val hotel = hotelRepository.saveAndFlush(Hotel(name, address, PHONE, null))
		assertThat(hotel.version).isZero()

		hotel.update(name, address, PHONE, DESCRIPTION)
		hotelRepository.flush()
		assertThat(hotel.version).isEqualTo(1)

		hotel.update(" $name ", address, PHONE, DESCRIPTION)
		hotelRepository.flush()
		entityManager.clear()
		assertThat(hotelRepository.findById(checkNotNull(hotel.id)).orElseThrow().version).isEqualTo(1)
	}

	@ParameterizedTest
	@CsvSource(
		"name, '', hotel_name_check",
		"name, ' 호텔', hotel_name_check",
		"name, '호텔 ', hotel_name_check",
		"address, '', hotel_address_check",
		"address, ' 주소', hotel_address_check",
		"phone, '', hotel_phone_check",
		"phone, ' 02-1234-5678', hotel_phone_check",
		"phone, '02 1234 5678', hotel_phone_check",
		"phone, '+82-2-1234-5678', hotel_phone_check",
		"phone, '1234567', hotel_phone_check",
		"phone, '123456789012', hotel_phone_check",
		"phone, '--------', hotel_phone_check",
		"description, '', hotel_description_check",
		"description, '소개 ', hotel_description_check",
	)
	fun `규칙에 맞지 않는 값은 DB CHECK 제약이 저장을 막는다`(column: String, value: String, constraint: String) {
		assertThatThrownBy { insertWithoutEntity(mapOf(column to value)) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining(constraint)
	}

	@ParameterizedTest
	@ValueSource(strings = ["1588-1234", "02-1234-5678", "010-1234-5678", "01012345678", "02--1234-5678"])
	fun `숫자와 -만 있고 숫자가 8~11개인 전화번호는 DB CHECK 제약을 통과한다`(phone: String) {
		insertWithoutEntity(mapOf("phone" to phone))

		assertThat(hotelRepository.findAll().filter { it.name == name }.map { it.phone }).containsExactly(phone)
	}

	private fun insertWithoutEntity(overrides: Map<String, String?>) {
		val values = mapOf("name" to name, "address" to address, "phone" to PHONE, "description" to null) + overrides
		jdbcTemplate.update(INSERT_HOTEL, values["name"], values["address"], values["phone"], values["description"])
	}

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val OTHER_PHONE = "02-8765-4321"
		private const val DESCRIPTION = "강남역 근처 호텔"
		private const val INSERT_HOTEL =
			"insert into hotel (name, address, phone, description, version, created_at, updated_at) values (?, ?, ?, ?, 0, now(), now())"
	}
}
