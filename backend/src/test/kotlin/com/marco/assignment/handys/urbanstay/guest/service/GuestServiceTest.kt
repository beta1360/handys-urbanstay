package com.marco.assignment.handys.urbanstay.guest.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.guest.exception.GuestErrorCode
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@Import(TestcontainersConfiguration::class)
class GuestServiceTest {

	@Autowired
	private lateinit var guestService: GuestService

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var transactionManager: PlatformTransactionManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val executor = Executors.newFixedThreadPool(2)

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	@BeforeEach
	fun createHotel() {
		hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", HOTEL_PHONE, null))
	}

	@AfterEach
	fun deleteHotel() {
		executor.shutdownNow()
		jdbcTemplate.update(DELETE_GUESTS, hotel.id)
		hotelRepository.deleteById(checkNotNull(hotel.id))
	}

	@Test
	fun `먼저 온 등록이 커밋되기 전이라 중복 확인을 통과한 하이픈 모양만 다른 전화번호의 등록도 DB 유일 인덱스에 막혀 GUEST_PHONE_DUPLICATED로 거절된다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { create(FIRST_NAME, "010-1234-5678") },
			second = { create(SECOND_NAME, "01012345678") },
		)

		assertErrorCode(second, GuestErrorCode.GUEST_PHONE_DUPLICATED)
		assertThat(guests()).containsExactly(FIRST_NAME to "010-1234-5678")
	}

	@Test
	fun `먼저 온 수정이 커밋되기 전이라 version 확인을 통과한 수정도 JPA 버전 검사에 막혀 GUEST_MODIFIED로 거절된다`() {
		val guestId = checkNotNull(create(FIRST_NAME, PHONE).id)

		val second = runSecondWhileFirstUncommitted(
			first = { update(guestId, FIRST_UPDATE_NAME) },
			second = { update(guestId, SECOND_UPDATE_NAME) },
		)

		assertErrorCode(second, GuestErrorCode.GUEST_MODIFIED)
		assertThat(guests()).containsExactly(FIRST_UPDATE_NAME to PHONE)
		assertThat(jdbcTemplate.queryForObject(SELECT_VERSION, Long::class.java, guestId)).isEqualTo(1)
	}

	private fun create(name: String, phone: String) = guestService.create(checkNotNull(hotel.id), name, phone, EMAIL)

	private fun update(guestId: Long, name: String) = guestService.update(checkNotNull(hotel.id), guestId, 0, name, PHONE, EMAIL)

	private fun <T> runSecondWhileFirstUncommitted(first: () -> Unit, second: () -> T): Result<T> {
		val firstApplied = CountDownLatch(1)
		val commitFirst = CountDownLatch(1)
		val firstTransaction = executor.submit {
			TransactionTemplate(transactionManager).executeWithoutResult {
				first()
				firstApplied.countDown()
				check(commitFirst.await(TIMEOUT_SECONDS, TimeUnit.SECONDS)) { "first transaction was not released" }
			}
		}
		check(firstApplied.await(TIMEOUT_SECONDS, TimeUnit.SECONDS)) { "first transaction did not apply its change" }
		val secondResult = executor.submit(Callable { runCatching(second) })
		awaitLockWait()
		commitFirst.countDown()
		firstTransaction.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
		return secondResult.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
	}

	private fun awaitLockWait() {
		val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SECONDS)
		while (jdbcTemplate.queryForObject(LOCK_WAITS, Int::class.java, "%guest %") == 0) {
			check(System.nanoTime() < deadline) { "second transaction never waited for the first one's lock on guest" }
			Thread.sleep(POLL_INTERVAL_MILLIS)
		}
	}

	private fun assertErrorCode(result: Result<*>, errorCode: ErrorCode) {
		assertThat(result.exceptionOrNull())
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(errorCode) }
	}

	private fun guests(): List<Pair<String, String>> =
		jdbcTemplate.query(SELECT_GUESTS, { rs, _ -> rs.getString("name") to rs.getString("phone") }, hotel.id)

	companion object {
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val PHONE = "010-1234-5678"
		private const val EMAIL = "guest@example.com"
		private const val FIRST_NAME = "먼저 등록한 이용객"
		private const val SECOND_NAME = "나중에 등록한 이용객"
		private const val FIRST_UPDATE_NAME = "먼저 수정한 이름"
		private const val SECOND_UPDATE_NAME = "나중에 수정한 이름"
		private const val TIMEOUT_SECONDS = 10L
		private const val POLL_INTERVAL_MILLIS = 20L
		private const val DELETE_GUESTS = "delete from guest where hotel_id = ?"
		private const val SELECT_GUESTS = "select name, phone from guest where hotel_id = ? order by id"
		private const val SELECT_VERSION = "select version from guest where id = ?"
		private const val LOCK_WAITS = """
			select count(*) from pg_stat_activity
			where datname = current_database() and wait_event_type = 'Lock' and query ilike ?
		"""
	}
}
