package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.dao.DataAccessResourceFailureException
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import java.lang.reflect.Proxy
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class HotelAdminAuthServiceTest {

	@Autowired
	private lateinit var hotelAdminAuthService: HotelAdminAuthService

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	@BeforeEach
	fun saveHotel() {
		hotel = hotelRepository.saveAndFlush(Hotel("어반스테이 $suffix", "서울 $suffix", "02-1234-5678", null))
	}

	@Test
	fun `인증한 결과에는 입력한 비밀번호와 비밀번호 해시가 남지 않고 계정 id, 호텔 id, 로그인 정보 버전과 역할이 남는다`() {
		val master = save("master-$suffix@test.local", HotelAdminRole.MASTER)

		val authentication = hotelAdminAuthService.authenticate("master-$suffix@test.local", PASSWORD)

		assertThat(authentication.isAuthenticated).isTrue()
		assertThat(authentication.credentials).isNull()
		assertThat(authentication.principal).isInstanceOfSatisfying(HotelAdminPrincipal::class.java) {
			assertThat(it.password).isNull()
			assertThat(listOf(it.id, it.hotelId, it.credentialVersion)).containsExactly(master.id, hotel.id, 0L)
		}
		assertThat(roles(authentication.authorities.map { it.authority })).containsExactly("ROLE_HOTEL_ADMIN", "ROLE_HOTEL_MASTER")
	}

	@Test
	fun `운영자로 인증하면 HOTEL_MASTER 역할은 없다`() {
		save("operator-$suffix@test.local", HotelAdminRole.OPERATOR)

		val authentication = hotelAdminAuthService.authenticate("operator-$suffix@test.local", PASSWORD)

		assertThat(roles(authentication.authorities.map { it.authority })).containsExactly("ROLE_HOTEL_ADMIN")
	}

	@Test
	fun `비밀번호가 틀리면 INVALID_CREDENTIALS로 거절한다`() {
		save("master-$suffix@test.local", HotelAdminRole.MASTER)

		assertThatThrownBy { hotelAdminAuthService.authenticate("master-$suffix@test.local", "wrong-password-1") }
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(AccountErrorCode.INVALID_CREDENTIALS) }
	}

	@Test
	fun `계정을 읽다가 오류가 나면 로그인 실패가 아니라 서버 오류로 던진다`() {
		val failingRepository = Proxy.newProxyInstance(javaClass.classLoader, arrayOf(HotelAdminRepository::class.java)) { _, _, _ ->
			throw DataAccessResourceFailureException("database unavailable")
		} as HotelAdminRepository
		val service = HotelAdminAuthService(
			HotelAdminUserDetailsService(failingRepository),
			PasswordEncoderFactories.createDelegatingPasswordEncoder(),
			failingRepository,
		)

		assertThatThrownBy { service.authenticate("master@test.local", PASSWORD) }
			.isInstanceOf(IllegalStateException::class.java)
			.hasRootCauseInstanceOf(DataAccessResourceFailureException::class.java)
	}

	private fun roles(authorities: List<String?>): List<String?> = authorities.filter { it?.startsWith("ROLE_") == true }

	private fun save(loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.saveAndFlush(HotelAdmin(hotel, loginId, checkNotNull(passwordEncoder.encode(PASSWORD)), "홍길동", role))

	companion object {
		private const val PASSWORD = "hotel-password-1"
	}
}
