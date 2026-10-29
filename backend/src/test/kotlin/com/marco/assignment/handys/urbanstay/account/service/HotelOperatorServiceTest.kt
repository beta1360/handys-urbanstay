package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
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
class HotelOperatorServiceTest {

	@Autowired
	private lateinit var hotelOperatorService: HotelOperatorService

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var transactionManager: PlatformTransactionManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val executor = Executors.newFixedThreadPool(2)

	private val suffix = UUID.randomUUID().toString().take(8)

	private val createdHotelIds = mutableListOf<Long>()

	private lateinit var hotel: Hotel

	private lateinit var otherHotel: Hotel

	@BeforeEach
	fun createHotels() {
		hotel = saveHotel("어반스테이 $suffix")
		otherHotel = saveHotel("다른 호텔 $suffix")
	}

	@AfterEach
	fun deleteHotels() {
		executor.shutdownNow()
		createdHotelIds.forEach { jdbcTemplate.update(DELETE_HOTEL_ADMINS, it) }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `먼저 온 등록이 커밋되기 전이라 아이디 중복 확인을 통과한 다른 호텔의 같은 아이디 등록도 DB 유일 제약에 막혀 LOGIN_ID_DUPLICATED로 거절된다`() {
		val loginId = "operator-$suffix@test.local"

		val second = runSecondWhileFirstUncommitted(
			first = { hotelOperatorService.create(checkNotNull(hotel.id), loginId, OPERATOR_NAME, PASSWORD) },
			second = { hotelOperatorService.create(checkNotNull(otherHotel.id), " ${loginId.uppercase()} ", OPERATOR_NAME, PASSWORD) },
			lockedTable = "hotel_admin",
		)

		assertErrorCode(second, AccountErrorCode.LOGIN_ID_DUPLICATED)
		assertThat(hotelIdsOfLoginId(loginId)).containsExactly(hotel.id)
	}

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun hotelIdsOfLoginId(loginId: String): List<Long> =
		jdbcTemplate.queryForList(SELECT_HOTEL_IDS_OF_LOGIN_ID, Long::class.javaObjectType, loginId).filterNotNull()

	private fun <T> runSecondWhileFirstUncommitted(first: () -> Unit, second: () -> T, lockedTable: String): Result<T> {
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
		awaitLockWait(lockedTable)
		commitFirst.countDown()
		firstTransaction.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
		return secondResult.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
	}

	private fun awaitLockWait(table: String) {
		val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SECONDS)
		while (jdbcTemplate.queryForObject(LOCK_WAITS, Int::class.java, "%$table %") == 0) {
			check(System.nanoTime() < deadline) { "second transaction never waited for the first one's lock on $table" }
			Thread.sleep(POLL_INTERVAL_MILLIS)
		}
	}

	private fun assertErrorCode(result: Result<*>, errorCode: ErrorCode) {
		assertThat(result.exceptionOrNull())
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(errorCode) }
	}

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val OPERATOR_NAME = "운영자"
		private const val PASSWORD = "operator-password-1"
		private const val TIMEOUT_SECONDS = 10L
		private const val POLL_INTERVAL_MILLIS = 20L
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val SELECT_HOTEL_IDS_OF_LOGIN_ID = "select hotel_id from hotel_admin where login_id = ?"
		private const val LOCK_WAITS = """
			select count(*) from pg_stat_activity
			where datname = current_database() and wait_event_type = 'Lock' and query ilike ?
		"""
	}
}
