package com.marco.assignment.handys.urbanstay.stay.service

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.TODAY
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
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
	private lateinit var roomTypeRepository: RoomTypeRepository

	private val roomTypes = mutableMapOf<String, RoomType>()

	@Autowired
	private lateinit var guestRepository: GuestRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var transactionManager: PlatformTransactionManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val executor = Executors.newFixedThreadPool(2)

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	private lateinit var room: Room

	private lateinit var guest: Guest

	private lateinit var hotelAdmin: HotelAdmin

	@BeforeEach
	fun createRoomAndGuest() {
		hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null))
		room = saveRoom("101", STANDARD)
		guest = guestRepository.save(Guest(hotel, "홍길동", "010-1234-5678", "guest@example.com"))
		hotelAdmin = hotelAdminRepository.save(HotelAdmin(hotel, "master-$suffix@test.local", "password-hash", "마스터", HotelAdminRole.MASTER))
	}

	@AfterEach
	fun deleteHotel() {
		executor.shutdownNow()
		DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotel.id) }
		hotelAdminRepository.deleteById(checkNotNull(hotelAdmin.id))
		hotelRepository.deleteById(checkNotNull(hotel.id))
	}

	@Test
	fun `같은 유형의 먼저 온 예약이 커밋되기 전이면 다음 예약은 그 유형 객실의 잠금을 기다렸다가 커밋된 이용을 보고 다음 이름순 객실을 배정한다`() {
		saveRoom("102", STANDARD)

		val second = runSecondWhileFirstUncommitted(
			first = { reserve(STANDARD, TODAY, TODAY.plusDays(2), FIRST_NAME, NEW_PHONE) },
			second = { reserve(STANDARD, TODAY.plusDays(1), TODAY.plusDays(3), SECOND_NAME, OTHER_PHONE) },
			lockedQuery = ROOM_LOCK,
		)

		assertThat(second.getOrThrow().room.name).isEqualTo("102")
		assertThat(stays()).containsExactly(Triple("101", TODAY, TODAY.plusDays(2)), Triple("102", TODAY.plusDays(1), TODAY.plusDays(3)))
	}

	@Test
	fun `같은 유형의 먼저 온 예약이 마지막 빈 객실로 커밋되면 잠금을 기다린 다음 예약은 ROOM_TYPE_UNAVAILABLE로 거절되고 새 이용객도 남지 않는다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { create(TODAY, TODAY.plusDays(2)) },
			second = { reserve(STANDARD, TODAY.plusDays(1), TODAY.plusDays(3), SECOND_NAME, NEW_PHONE) },
			lockedQuery = ROOM_LOCK,
		)

		assertThat(second.exceptionOrNull())
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(RoomErrorCode.ROOM_TYPE_UNAVAILABLE) }
		assertThat(stays()).containsExactly(Triple("101", TODAY, TODAY.plusDays(2)))
		assertThat(guests()).containsExactly(guest.name to guest.phone)
	}

	@Test
	fun `잠금을 거치지 않고 넣은 겹치는 이용이 커밋되기 전이라 빈 객실로 보고 배정한 예약도 DB 배제 제약에 막혀 STAY_PERIOD_OVERLAPPED로 거절되고 새 이용객도 남지 않는다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { jdbcTemplate.update(INSERT_STAY, room.id, guest.id, TODAY, TODAY.plusDays(3)) },
			second = { reserve(STANDARD, TODAY.plusDays(2), TODAY.plusDays(4), SECOND_NAME, NEW_PHONE) },
			lockedQuery = "insert into stay",
		)

		assertThat(second.exceptionOrNull())
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(StayErrorCode.STAY_PERIOD_OVERLAPPED) }
		assertThat(stays()).containsExactly(Triple("101", TODAY, TODAY.plusDays(3)))
		assertThat(guests()).containsExactly(guest.name to guest.phone)
	}

	@Test
	fun `다른 유형으로 먼저 온 같은 새 이용객의 예약이 커밋되기 전이라 이용객을 찾지 못한 예약도 이용객 등록에서 기다렸다가 먼저 등록된 이용객으로 예약하고 이용객은 하나만 남는다`() {
		saveRoom("201", DELUXE)

		val second = runSecondWhileFirstUncommitted(
			first = { reserve(STANDARD, TODAY, TODAY.plusDays(2), FIRST_NAME, NEW_PHONE) },
			second = { reserve(DELUXE, TODAY, TODAY.plusDays(2), SECOND_NAME, NEW_PHONE.replace("-", "")) },
			lockedQuery = "insert into guest",
		)

		assertThat(second.getOrThrow().guest.name).isEqualTo(FIRST_NAME)
		assertThat(guests()).containsExactly(guest.name to guest.phone, FIRST_NAME to NEW_PHONE)
		assertThat(jdbcTemplate.queryForList(SELECT_STAY_GUEST_NAMES, String::class.java, hotel.id)).containsExactly(FIRST_NAME, FIRST_NAME)
	}

	@Test
	fun `먼저 온 취소가 커밋되기 전이라 취소 여부 확인을 통과한 취소도 조건부 UPDATE가 0행이라 STAY_ALREADY_CANCELED로 거절되고 한 번만 기록된다`() {
		val stayId = checkNotNull(create(TODAY, TODAY.plusDays(2)).id)
		jdbcTemplate.update(UPDATE_ROOM_STATUS, RoomStatus.RESERVED.name, room.id)

		val second = runSecondWhileFirstUncommitted(
			first = { cancel(stayId, FIRST_REASON) },
			second = { cancel(stayId, SECOND_REASON) },
			lockedQuery = "update stay",
		)

		assertThat(second.exceptionOrNull())
			.isInstanceOfSatisfying(BusinessException::class.java) { assertThat(it.errorCode).isEqualTo(StayErrorCode.STAY_ALREADY_CANCELED) }
		assertThat(jdbcTemplate.queryForList(SELECT_CANCEL_REASONS, String::class.java, room.id)).containsExactly(FIRST_REASON)
		assertThat(jdbcTemplate.queryForList(SELECT_HISTORIES, String::class.java, room.id)).containsExactly("${RoomStatus.RESERVED} -> ${RoomStatus.VACANT}")
	}

	private fun saveRoom(name: String, type: String): Room =
		roomRepository.save(Room(hotel, name, roomType(type), null, null))

	private fun roomType(name: String): RoomType =
		roomTypes.getOrPut(name) { roomTypeRepository.save(RoomType(hotel, name, 2, 100000, LocalTime.of(15, 0), LocalTime.of(11, 0))) }

	private fun create(checkInDate: LocalDate, checkOutDate: LocalDate) = reserve(STANDARD, checkInDate, checkOutDate, guest.name, guest.phone)

	private fun reserve(roomType: String, checkInDate: LocalDate, checkOutDate: LocalDate, name: String, phone: String) =
		stayService.reserve(checkNotNull(hotel.id), checkNotNull(roomType(roomType).id), checkInDate, checkOutDate, 2, name, phone, "guest@example.com")

	private fun cancel(stayId: Long, reason: String) = stayService.cancel(checkNotNull(hotel.id), stayId, checkNotNull(hotelAdmin.id), reason)

	private fun <T> runSecondWhileFirstUncommitted(first: () -> Unit, second: () -> T, lockedQuery: String): Result<T> {
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
		awaitLockWait(lockedQuery)
		commitFirst.countDown()
		firstTransaction.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
		return secondResult.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
	}

	private fun awaitLockWait(query: String) {
		val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SECONDS)
		while (jdbcTemplate.queryForObject(LOCK_WAITS, Int::class.java, "%$query%") == 0) {
			check(System.nanoTime() < deadline) { "second transaction never waited for the first one's lock ($query)" }
			Thread.sleep(POLL_INTERVAL_MILLIS)
		}
	}

	private fun stays(): List<Triple<String, LocalDate, LocalDate>> =
		jdbcTemplate.query(
			SELECT_STAYS,
			{ rs, _ -> Triple(rs.getString(1), rs.getObject(2, LocalDate::class.java), rs.getObject(3, LocalDate::class.java)) },
			hotel.id,
		)

	private fun guests(): List<Pair<String, String>> =
		jdbcTemplate.query(SELECT_GUESTS, { rs, _ -> rs.getString("name") to rs.getString("phone") }, hotel.id)

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val NEW_PHONE = "010-5555-0000"
		private const val OTHER_PHONE = "010-6666-0000"
		private const val STANDARD = "스탠다드"
		private const val DELUXE = "디럭스"
		private const val FIRST_NAME = "먼저 예약한 이용객"
		private const val SECOND_NAME = "나중에 예약한 이용객"
		private const val TIMEOUT_SECONDS = 10L
		private const val POLL_INTERVAL_MILLIS = 20L
		private const val FIRST_REASON = "먼저 보낸 사유"
		private const val SECOND_REASON = "나중에 보낸 사유"
		private const val ROOM_LOCK = "for no key update"
		private val DELETE_BY_HOTEL = listOf(
			"delete from stay where room_id in (select id from room where hotel_id = ?)",
			"delete from room_status_history where room_id in (select id from room where hotel_id = ?)",
			"delete from guest where hotel_id = ?",
			"delete from room where hotel_id = ?",
			"delete from room_type where hotel_id = ?",
		)
		private const val INSERT_STAY = """
			insert into stay (room_id, guest_id, check_in_date, check_out_date, guest_count, room_rate, nights, base_amount, discount_amount, total_amount, created_at, updated_at)
			select room_id, guest_id, check_in, check_out, 2, 0, check_out - check_in, 0, 0, 0, now(), now()
			from (select cast(? as bigint) room_id, cast(? as bigint) guest_id, cast(? as date) check_in, cast(? as date) check_out) v
		"""
		private const val UPDATE_ROOM_STATUS = "update room set status = ? where id = ?"
		private const val SELECT_STAYS = """
			select r.name, s.check_in_date, s.check_out_date from stay s join room r on r.id = s.room_id where r.hotel_id = ? order by s.id
		"""
		private const val SELECT_GUESTS = "select name, phone from guest where hotel_id = ? order by id"
		private const val SELECT_STAY_GUEST_NAMES = "select g.name from stay s join guest g on g.id = s.guest_id where g.hotel_id = ? order by s.id"
		private const val SELECT_CANCEL_REASONS = "select cancel_reason from stay where room_id = ? and canceled_at is not null"
		private const val SELECT_HISTORIES = "select from_status || ' -> ' || to_status from room_status_history where room_id = ? order by id"
		private const val LOCK_WAITS = """
			select count(*) from pg_stat_activity
			where datname = current_database() and wait_event_type = 'Lock' and query ilike ?
		"""
	}
}
