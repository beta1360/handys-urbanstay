package com.marco.assignment.handys.urbanstay.account.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
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
class HotelMasterServiceTest {

	@Autowired
	private lateinit var hotelMasterService: HotelMasterService

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var transactionManager: PlatformTransactionManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val executor = Executors.newFixedThreadPool(2)

	private val suffix = UUID.randomUUID().toString().take(8)

	private val createdHotelIds = mutableListOf<Long>()

	private lateinit var master: HotelAdmin

	private lateinit var otherMaster: HotelAdmin

	@BeforeEach
	fun createMasters() {
		master = saveMaster("어반스테이 $suffix", "master-$suffix@test.local")
		otherMaster = saveMaster("다른 호텔 $suffix", "other-master-$suffix@test.local")
	}

	@AfterEach
	fun deleteHotels() {
		executor.shutdownNow()
		createdHotelIds.forEach { jdbcTemplate.update(DELETE_HOTEL_ADMINS, it) }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `먼저 온 수정이 커밋되기 전이라 version 확인을 통과한 수정도 JPA 버전 검사에 막혀 HOTEL_ADMIN_MODIFIED로 거절된다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { hotelMasterService.update(hotelIdOf(master), 0, master.loginId, FIRST_NAME) },
			second = { hotelMasterService.update(hotelIdOf(master), 0, master.loginId, SECOND_NAME) },
			lockedTable = "hotel_admin",
		)

		assertErrorCode(second, AccountErrorCode.HOTEL_ADMIN_MODIFIED)
		val saved = reload(master)
		assertThat(listOf(saved.name, saved.version, saved.credentialVersion)).containsExactly(FIRST_NAME, 1L, 0L)
	}

	@Test
	fun `먼저 온 아이디 변경이 커밋되기 전이라 중복 확인을 통과한 다른 마스터의 같은 아이디 변경도 DB 유일 제약에 막혀 LOGIN_ID_DUPLICATED로 거절된다`() {
		val newLoginId = "new-$suffix@test.local"

		val second = runSecondWhileFirstUncommitted(
			first = { hotelMasterService.update(hotelIdOf(master), 0, newLoginId, MASTER_NAME) },
			second = { hotelMasterService.update(hotelIdOf(otherMaster), 0, " ${newLoginId.uppercase()} ", MASTER_NAME) },
			lockedTable = "hotel_admin",
		)

		assertErrorCode(second, AccountErrorCode.LOGIN_ID_DUPLICATED)
		assertThat(reload(master).loginId).isEqualTo(newLoginId)
		val unchanged = reload(otherMaster)
		assertThat(listOf(unchanged.loginId, unchanged.version, unchanged.credentialVersion)).containsExactly(otherMaster.loginId, 0L, 0L)
	}

	@Test
	fun `먼저 온 수정이 커밋되기 전에 읽은 비밀번호 재설정도 JPA 버전 검사에 막혀 HOTEL_ADMIN_MODIFIED로 거절되고 비밀번호는 그대로다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { hotelMasterService.update(hotelIdOf(master), 0, master.loginId, FIRST_NAME) },
			second = { hotelMasterService.resetPassword(hotelIdOf(master), NEW_PASSWORD) },
			lockedTable = "hotel_admin",
		)

		assertErrorCode(second, AccountErrorCode.HOTEL_ADMIN_MODIFIED)
		val saved = reload(master)
		assertThat(listOf(saved.name, saved.passwordHash, saved.version, saved.credentialVersion)).containsExactly(FIRST_NAME, PASSWORD_HASH, 1L, 0L)
	}

	private fun saveMaster(hotelName: String, loginId: String): HotelAdmin {
		val hotel = hotelRepository.save(Hotel(hotelName, "서울 $suffix", PHONE, null))
		createdHotelIds += checkNotNull(hotel.id)
		return hotelAdminRepository.save(HotelAdmin(hotel, loginId, PASSWORD_HASH, MASTER_NAME, HotelAdminRole.MASTER))
	}

	private fun hotelIdOf(hotelAdmin: HotelAdmin): Long = checkNotNull(hotelAdmin.hotel.id)

	private fun reload(hotelAdmin: HotelAdmin): HotelAdmin = hotelAdminRepository.findById(checkNotNull(hotelAdmin.id)).orElseThrow()

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
		private const val PASSWORD_HASH = "password-hash"
		private const val MASTER_NAME = "마스터"
		private const val FIRST_NAME = "먼저 바꾼 이름"
		private const val SECOND_NAME = "나중에 바꾼 이름"
		private const val NEW_PASSWORD = "new-password-1"
		private const val TIMEOUT_SECONDS = 10L
		private const val POLL_INTERVAL_MILLIS = 20L
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val LOCK_WAITS = """
			select count(*) from pg_stat_activity
			where datname = current_database() and wait_event_type = 'Lock' and query ilike ?
		"""
	}
}
