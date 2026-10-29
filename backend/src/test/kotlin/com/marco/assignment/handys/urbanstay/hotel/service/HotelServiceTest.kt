package com.marco.assignment.handys.urbanstay.hotel.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
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
class HotelServiceTest {

	@Autowired
	private lateinit var hotelService: HotelService

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var transactionManager: PlatformTransactionManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val executor = Executors.newFixedThreadPool(2)

	private val suffix = UUID.randomUUID().toString().take(8)
	private val name = "어반스테이 $suffix"
	private val address = "서울특별시 강남구 테헤란로 $suffix"

	private lateinit var existingIds: Set<Long>

	@BeforeEach
	fun rememberExistingHotels() {
		existingIds = hotelIds()
	}

	@AfterEach
	fun deleteCreatedHotels() {
		executor.shutdownNow()
		hotelRepository.deleteAllByIdInBatch(hotelIds() - existingIds)
	}

	@Test
	fun `먼저 온 등록이 커밋되기 전이라 중복 확인을 통과한 등록도 DB 유일 제약에 막혀 HOTEL_DUPLICATED로 거절된다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { hotelService.create(name, address, PHONE, null) },
			second = { hotelService.create(name, address, OTHER_PHONE, null) },
		)

		assertErrorCode(second, HotelErrorCode.HOTEL_DUPLICATED)
		assertThat(hotelsNamed(name).map { it.phone }).containsExactly(PHONE)
	}

	@Test
	fun `먼저 온 수정이 커밋되기 전이라 version 확인을 통과한 수정도 JPA 버전 검사에 막혀 HOTEL_MODIFIED로 거절된다`() {
		val hotelId = checkNotNull(hotelService.create(name, address, PHONE, null).id)

		val second = runSecondWhileFirstUncommitted(
			first = { hotelService.update(hotelId, 0, name, address, PHONE, FIRST_DESCRIPTION) },
			second = { hotelService.update(hotelId, 0, name, address, PHONE, SECOND_DESCRIPTION) },
		)

		assertErrorCode(second, HotelErrorCode.HOTEL_MODIFIED)
		val hotel = hotelRepository.findById(hotelId).orElseThrow()
		assertThat(hotel.description).isEqualTo(FIRST_DESCRIPTION)
		assertThat(hotel.version).isEqualTo(1)
	}

	@Test
	fun `등록이 커밋되기 전이라 중복 확인을 통과한 수정도 DB 유일 제약에 막혀 HOTEL_DUPLICATED로 거절된다`() {
		val other = hotelService.create("다른 호텔 $suffix", address, PHONE, null)
		val otherId = checkNotNull(other.id)

		val second = runSecondWhileFirstUncommitted(
			first = { hotelService.create(name, address, PHONE, null) },
			second = { hotelService.update(otherId, other.version, name, address, OTHER_PHONE, null) },
		)

		assertErrorCode(second, HotelErrorCode.HOTEL_DUPLICATED)
		val unchanged = hotelRepository.findById(otherId).orElseThrow()
		assertThat(listOf(unchanged.name, unchanged.phone, unchanged.version)).containsExactly("다른 호텔 $suffix", PHONE, 0L)
		assertThat(hotelsNamed(name)).hasSize(1)
	}

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
		awaitHotelLockWait()
		commitFirst.countDown()
		firstTransaction.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
		return secondResult.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
	}

	private fun awaitHotelLockWait() {
		val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SECONDS)
		while (jdbcTemplate.queryForObject(HOTEL_LOCK_WAITS, Int::class.java) == 0) {
			check(System.nanoTime() < deadline) { "second transaction never waited for the first one's lock on hotel" }
			Thread.sleep(POLL_INTERVAL_MILLIS)
		}
	}

	private fun assertErrorCode(result: Result<*>, errorCode: HotelErrorCode) {
		assertThat(result.exceptionOrNull())
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(errorCode) }
	}

	private fun hotelsNamed(name: String): List<Hotel> = hotelRepository.findAll().filter { it.name == name }

	private fun hotelIds(): Set<Long> = hotelRepository.findAll().mapNotNull { it.id }.toSet()

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val OTHER_PHONE = "02-8765-4321"
		private const val FIRST_DESCRIPTION = "먼저 수정한 소개"
		private const val SECOND_DESCRIPTION = "나중에 수정한 소개"
		private const val TIMEOUT_SECONDS = 10L
		private const val POLL_INTERVAL_MILLIS = 20L
		private const val HOTEL_LOCK_WAITS = """
			select count(*) from pg_stat_activity
			where datname = current_database() and wait_event_type = 'Lock' and query ilike '%hotel%'
		"""
	}
}
