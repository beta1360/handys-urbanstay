package com.marco.assignment.handys.urbanstay.stay.service

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.TODAY
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.stay.exception.StayErrorCode
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
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@Import(TestcontainersConfiguration::class, FixedClockConfiguration::class)
class StayServiceTest {

	@Autowired
	private lateinit var stayService: StayService

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var roomRepository: RoomRepository

	@Autowired
	private lateinit var guestRepository: GuestRepository

	@Autowired
	private lateinit var transactionManager: PlatformTransactionManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val executor = Executors.newFixedThreadPool(2)

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	private lateinit var room: Room

	private lateinit var guest: Guest

	@BeforeEach
	fun createRoomAndGuest() {
		hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null))
		room = roomRepository.save(Room(hotel, "101", "스탠다드", 2, null, null, LocalTime.of(15, 0), LocalTime.of(11, 0)))
		guest = guestRepository.save(Guest(hotel, "홍길동", "010-1234-5678", "guest@example.com"))
	}

	@AfterEach
	fun deleteHotel() {
		executor.shutdownNow()
		jdbcTemplate.update(DELETE_STAYS, room.id)
		guestRepository.deleteById(checkNotNull(guest.id))
		roomRepository.deleteById(checkNotNull(room.id))
		hotelRepository.deleteById(checkNotNull(hotel.id))
	}

	@Test
	fun `먼저 온 등록이 커밋되기 전이라 겹침 확인을 통과한 겹치는 기간의 등록도 DB 배제 제약에 막혀 STAY_PERIOD_OVERLAPPED로 거절된다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { create(TODAY, TODAY.plusDays(3)) },
			second = { create(TODAY.plusDays(2), TODAY.plusDays(4)) },
		)

		assertThat(second.exceptionOrNull())
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(StayErrorCode.STAY_PERIOD_OVERLAPPED) }
		assertThat(stays()).containsExactly(TODAY to TODAY.plusDays(3))
	}

	private fun create(checkInDate: LocalDate, checkOutDate: LocalDate) =
		stayService.create(checkNotNull(hotel.id), checkNotNull(room.id), checkNotNull(guest.id), checkInDate, checkOutDate, 2)

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
		while (jdbcTemplate.queryForObject(LOCK_WAITS, Int::class.java, "%insert into stay%") == 0) {
			check(System.nanoTime() < deadline) { "second transaction never waited for the first one's lock on stay" }
			Thread.sleep(POLL_INTERVAL_MILLIS)
		}
	}

	private fun stays(): List<Pair<LocalDate, LocalDate>> =
		jdbcTemplate.query(SELECT_STAYS, { rs, _ -> rs.getObject(1, LocalDate::class.java) to rs.getObject(2, LocalDate::class.java) }, room.id)

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val TIMEOUT_SECONDS = 10L
		private const val POLL_INTERVAL_MILLIS = 20L
		private const val DELETE_STAYS = "delete from stay where room_id = ?"
		private const val SELECT_STAYS = "select check_in_date, check_out_date from stay where room_id = ? order by id"
		private const val LOCK_WAITS = """
			select count(*) from pg_stat_activity
			where datname = current_database() and wait_event_type = 'Lock' and query ilike ?
		"""
	}
}
