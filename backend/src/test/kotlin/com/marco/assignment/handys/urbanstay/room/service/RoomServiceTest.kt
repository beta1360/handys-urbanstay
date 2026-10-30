package com.marco.assignment.handys.urbanstay.room.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
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
import java.time.LocalTime
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@Import(TestcontainersConfiguration::class)
class RoomServiceTest {

	@Autowired
	private lateinit var roomService: RoomService

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

	private lateinit var hotel: Hotel

	private lateinit var hotelAdmin: HotelAdmin

	@BeforeEach
	fun createHotel() {
		hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }
		hotelAdmin = hotelAdminRepository.save(HotelAdmin(hotel, "master-$suffix@test.local", "password-hash", "마스터", HotelAdminRole.MASTER))
	}

	@AfterEach
	fun deleteHotel() {
		executor.shutdownNow()
		createdHotelIds.forEach {
			jdbcTemplate.update(DELETE_HISTORIES, it)
			jdbcTemplate.update(DELETE_ROOMS, it)
			jdbcTemplate.update(DELETE_HOTEL_ADMINS, it)
		}
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `먼저 온 등록이 커밋되기 전이라 중복 확인을 통과한 같은 이름의 등록도 DB 유일 제약에 막혀 ROOM_DUPLICATED로 거절된다`() {
		val second = runSecondWhileFirstUncommitted(
			first = { create(NAME, FIRST_TYPE) },
			second = { create(" $NAME ", SECOND_TYPE) },
			lockedTable = "room",
		)

		assertErrorCode(second, RoomErrorCode.ROOM_DUPLICATED)
		assertThat(rooms()).containsExactly(NAME to FIRST_TYPE)
		assertThat(histories()).containsExactly(null to RoomStatus.VACANT.name)
	}

	@Test
	fun `먼저 온 수정이 커밋되기 전이라 version 확인을 통과한 수정도 JPA 버전 검사에 막혀 ROOM_MODIFIED로 거절된다`() {
		val roomId = checkNotNull(create(NAME, FIRST_TYPE).id)

		val second = runSecondWhileFirstUncommitted(
			first = { update(roomId, NAME, FIRST_UPDATE_TYPE) },
			second = { update(roomId, NAME, SECOND_UPDATE_TYPE) },
			lockedTable = "room",
		)

		assertErrorCode(second, RoomErrorCode.ROOM_MODIFIED)
		assertThat(rooms()).containsExactly(NAME to FIRST_UPDATE_TYPE)
		assertThat(jdbcTemplate.queryForObject(SELECT_VERSION, Long::class.java, roomId)).isEqualTo(1)
	}

	@Test
	fun `등록이 커밋되기 전이라 중복 확인을 통과한 수정도 DB 유일 제약에 막혀 ROOM_DUPLICATED로 거절된다`() {
		val otherId = checkNotNull(create(OTHER_NAME, FIRST_TYPE).id)

		val second = runSecondWhileFirstUncommitted(
			first = { create(NAME, SECOND_TYPE) },
			second = { update(otherId, NAME, SECOND_UPDATE_TYPE) },
			lockedTable = "room",
		)

		assertErrorCode(second, RoomErrorCode.ROOM_DUPLICATED)
		assertThat(rooms()).containsExactly(OTHER_NAME to FIRST_TYPE, NAME to SECOND_TYPE)
		assertThat(jdbcTemplate.queryForObject(SELECT_VERSION, Long::class.java, otherId)).isZero()
	}

	@Test
	fun `먼저 온 상태 변경이 커밋되기 전이라 전이 확인을 통과한 같은 from의 변경도 조건부 UPDATE가 0행이라 ROOM_STATUS_CHANGED로 거절된다`() {
		val roomId = checkNotNull(create(NAME, FIRST_TYPE).id)

		val second = runSecondWhileFirstUncommitted(
			first = { changeStatus(roomId, RoomStatus.VACANT, RoomStatus.RESERVED) },
			second = { changeStatus(roomId, RoomStatus.VACANT, RoomStatus.MAINTENANCE) },
			lockedTable = "room",
		)

		assertErrorCode(second, RoomErrorCode.ROOM_STATUS_CHANGED)
		assertThat(jdbcTemplate.queryForMap(SELECT_STATUS_VERSION, roomId))
			.containsExactlyInAnyOrderEntriesOf(mapOf("status" to RoomStatus.RESERVED.name, "version" to 0L))
		assertThat(histories()).containsExactly(null to RoomStatus.VACANT.name, RoomStatus.VACANT.name to RoomStatus.RESERVED.name)
	}

	@Test
	fun `객실 수정이 객실을 읽은 뒤 상태 변경이 커밋돼도 수정의 저장은 version 확인을 통과하고 상태를 옛 값으로 덮어쓰지 않는다`() {
		val roomId = checkNotNull(create(NAME, FIRST_TYPE).id)

		val updated = TransactionTemplate(transactionManager).execute {
			val read = roomService.getRoom(checkNotNull(hotel.id), roomId)
			executor.submit(Callable { changeStatus(roomId, RoomStatus.VACANT, RoomStatus.RESERVED) }).get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
			update(roomId, NAME, FIRST_UPDATE_TYPE).also { assertThat(it).isSameAs(read) }
		}

		assertThat(checkNotNull(updated).version).isEqualTo(1)
		assertThat(jdbcTemplate.queryForMap(SELECT_STATUS_VERSION, roomId))
			.containsExactlyInAnyOrderEntriesOf(mapOf("status" to RoomStatus.RESERVED.name, "version" to 1L))
		assertThat(rooms()).containsExactly(NAME to FIRST_UPDATE_TYPE)
	}

	private fun changeStatus(roomId: Long, from: RoomStatus, to: RoomStatus): Room =
		roomService.changeStatus(checkNotNull(hotel.id), roomId, checkNotNull(hotelAdmin.id), from, to)

	private fun update(roomId: Long, name: String, type: String): Room =
		roomService.update(
			hotelId = checkNotNull(hotel.id),
			roomId = roomId,
			version = 0,
			name = name,
			type = type,
			capacity = 2,
			floor = 1,
			description = null,
			checkInTime = CHECK_IN,
			checkOutTime = CHECK_OUT,
		)

	private fun create(name: String, type: String): Room =
		roomService.create(
			hotelId = checkNotNull(hotel.id),
			hotelAdminId = checkNotNull(hotelAdmin.id),
			name = name,
			type = type,
			capacity = 2,
			floor = 1,
			description = null,
			checkInTime = CHECK_IN,
			checkOutTime = CHECK_OUT,
		)

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

	private fun rooms(): List<Pair<String, String>> =
		jdbcTemplate.query(SELECT_ROOMS, { rs, _ -> rs.getString("name") to rs.getString("type") }, hotel.id)

	private fun histories(): List<Pair<String?, String>> =
		jdbcTemplate.query(SELECT_HISTORIES, { rs, _ -> rs.getString("from_status") to rs.getString("to_status") }, hotel.id)

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val NAME = "101"
		private const val OTHER_NAME = "102"
		private const val FIRST_TYPE = "먼저 등록한 유형"
		private const val SECOND_TYPE = "나중에 등록한 유형"
		private const val FIRST_UPDATE_TYPE = "먼저 수정한 유형"
		private const val SECOND_UPDATE_TYPE = "나중에 수정한 유형"
		private val CHECK_IN: LocalTime = LocalTime.of(15, 0)
		private val CHECK_OUT: LocalTime = LocalTime.of(11, 0)
		private const val TIMEOUT_SECONDS = 10L
		private const val POLL_INTERVAL_MILLIS = 20L
		private const val DELETE_HISTORIES = "delete from room_status_history where room_id in (select id from room where hotel_id = ?)"
		private const val DELETE_ROOMS = "delete from room where hotel_id = ?"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val SELECT_ROOMS = "select name, type from room where hotel_id = ? order by id"
		private const val SELECT_VERSION = "select version from room where id = ?"
		private const val SELECT_STATUS_VERSION = "select status, version from room where id = ?"
		private const val SELECT_HISTORIES = """
			select h.from_status, h.to_status from room_status_history h join room r on r.id = h.room_id
			where r.hotel_id = ? order by h.id
		"""
		private const val LOCK_WAITS = """
			select count(*) from pg_stat_activity
			where datname = current_database() and wait_event_type = 'Lock' and query ilike ?
		"""
	}
}
