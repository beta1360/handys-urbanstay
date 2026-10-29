package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import jakarta.persistence.EntityManager
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class HotelAdminUserDetailsServiceTest {

	@Autowired
	private lateinit var hotelAdminUserDetailsService: HotelAdminUserDetailsService

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Autowired
	private lateinit var entityManager: EntityManager

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	@BeforeEach
	fun saveHotel() {
		hotel = hotelRepository.saveAndFlush(Hotel("어반스테이 $suffix", "서울 $suffix", "02-1234-5678", null))
	}

	@Test
	fun `대소문자와 앞뒤 공백이 다른 아이디로도 마스터를 찾고 계정 id, 호텔 id, 로그인 정보 버전과 HOTEL_ADMIN, HOTEL_MASTER 역할을 준다`() {
		val master = save("master-$suffix@test.local", HotelAdminRole.MASTER)

		val user = hotelAdminUserDetailsService.loadUserByUsername("  Master-$suffix@TEST.local ")

		assertThat(user).isInstanceOfSatisfying(HotelAdminPrincipal::class.java) {
			assertThat(listOf(it.id, it.hotelId, it.credentialVersion)).containsExactly(master.id, hotel.id, 0L)
		}
		assertThat(user.username).isEqualTo(master.loginId)
		assertThat(user.password).isEqualTo(master.passwordHash)
		assertThat(user.authorities.map { it.authority }).containsExactly("ROLE_HOTEL_ADMIN", "ROLE_HOTEL_MASTER")
	}

	@Test
	fun `운영자에게는 HOTEL_ADMIN 역할만 준다`() {
		save("operator-$suffix@test.local", HotelAdminRole.OPERATOR)

		val user = hotelAdminUserDetailsService.loadUserByUsername("operator-$suffix@test.local")

		assertThat(user.authorities.map { it.authority }).containsExactly("ROLE_HOTEL_ADMIN")
	}

	@Test
	fun `로그인 정보 버전은 저장된 현재 값을 담는다`() {
		val operator = save("operator-$suffix@test.local", HotelAdminRole.OPERATOR)
		jdbcTemplate.update("update hotel_admin set credential_version = 3 where id = ?", operator.id)
		entityManager.clear()

		val user = hotelAdminUserDetailsService.loadUserByUsername("operator-$suffix@test.local")

		assertThat((user as HotelAdminPrincipal).credentialVersion).isEqualTo(3)
	}

	@Test
	fun `없는 아이디면 UsernameNotFoundException을 던진다`() {
		assertThatThrownBy { hotelAdminUserDetailsService.loadUserByUsername("unknown-$suffix@test.local") }
			.isInstanceOf(UsernameNotFoundException::class.java)
	}

	@Test
	fun `비활성 계정은 없는 아이디와 같이 UsernameNotFoundException을 던진다`() {
		val operator = save("inactive-$suffix@test.local", HotelAdminRole.OPERATOR)
		jdbcTemplate.update("update hotel_admin set active = false where id = ?", operator.id)

		assertThatThrownBy { hotelAdminUserDetailsService.loadUserByUsername("inactive-$suffix@test.local") }
			.isInstanceOf(UsernameNotFoundException::class.java)
	}

	private fun save(loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.saveAndFlush(HotelAdmin(hotel, loginId, PASSWORD_HASH, "홍길동", role))

	companion object {
		private const val PASSWORD_HASH = "password-hash"
	}
}
