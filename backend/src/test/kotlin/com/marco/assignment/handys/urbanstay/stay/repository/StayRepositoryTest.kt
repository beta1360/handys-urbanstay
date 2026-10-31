package com.marco.assignment.handys.urbanstay.stay.repository

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@DataJpaTest
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
class StayRepositoryTest {

	@Autowired
	private lateinit var stayRepository: StayRepository

	@Autowired
	private lateinit var entityManager: TestEntityManager

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	private lateinit var roomType: RoomType

	private lateinit var room: Room

	private lateinit var otherRoom: Room

	private lateinit var guest: Guest

	private lateinit var hotelAdmin: HotelAdmin

	@BeforeEach
	fun saveRoomsAndGuest() {
		hotel = entityManager.persistAndFlush(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null))
		roomType = entityManager.persistAndFlush(RoomType(hotel, "스탠다드", 20, 100000, LocalTime.of(15, 0), LocalTime.of(11, 0)))
		room = entityManager.persistAndFlush(room("101"))
		otherRoom = entityManager.persistAndFlush(room("102"))
		guest = entityManager.persistAndFlush(Guest(hotel, "홍길동", PHONE, "guest@example.com"))
		hotelAdmin = entityManager.persistAndFlush(HotelAdmin(hotel, "master-$suffix@test.local", "password-hash", "마스터", HotelAdminRole.MASTER))
	}

	@Test
	fun `객실, 이용객, 체크인·체크아웃 날짜, 인원과 1박 요금으로 계산한 금액을 저장한다`() {
		val saved = stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE))
		entityManager.clear()

		val found = stayRepository.findById(checkNotNull(saved.id)).orElseThrow()
		assertThat(listOf(found.room.id, found.guest.id, found.checkInDate, found.checkOutDate, found.guestCount))
			.containsExactly(room.id, guest.id, CHECK_IN, CHECK_OUT, 2)
		assertThat(listOf(found.roomRate, found.nights, found.baseAmount, found.discountAmount, found.totalAmount))
			.containsExactly(ROOM_RATE, 2, ROOM_RATE * 2, 0, ROOM_RATE * 2)
	}

	@ParameterizedTest
	@CsvSource(
		delimiter = '|',
		value = [
			"base_amount = 1",
			"total_amount = 1",
			"nights = 3",
			"discount_amount = -1, total_amount = 200001",
			"room_rate = -1, base_amount = -2, total_amount = -2",
		],
	)
	fun `금액이 0보다 작거나 기본 금액이 1박 요금 × 박 수, 최종 금액이 기본 금액 - 할인 금액이 아니면 DB CHECK 제약이 막는다`(assignments: String) {
		val stayId = checkNotNull(stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE)).id)

		assertThatThrownBy { jdbcTemplate.update("update stay set $assignments where id = ?", stayId) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining("stay_amount_check")
	}

	@ParameterizedTest
	@CsvSource("2026-11-01, 2026-11-03", "2026-10-30, 2026-11-02", "2026-11-02, 2026-11-05", "2026-10-30, 2026-11-05", "2026-11-02, 2026-11-03")
	fun `같은 객실에 기간이 겹치는 이용은 이름 있는 배제 제약이 저장을 막는다`(checkIn: LocalDate, checkOut: LocalDate) {
		stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE))

		assertThatThrownBy { stayRepository.saveAndFlush(Stay(room, guest, checkIn, checkOut, 2, ROOM_RATE)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(Stay.ROOM_PERIOD_EXCLUSION_CONSTRAINT)).isTrue()
			}
	}

	@Test
	fun `체크아웃 날에 다음 체크인을 하는 이용과 다른 객실의 같은 기간 이용은 저장한다`() {
		stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE))
		stayRepository.saveAndFlush(Stay(room, guest, CHECK_OUT, CHECK_OUT.plusDays(2), 2, ROOM_RATE))
		stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN.minusDays(2), CHECK_IN, 2, ROOM_RATE))
		stayRepository.saveAndFlush(Stay(otherRoom, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE))

		assertThat(jdbcTemplate.queryForObject(COUNT_STAYS, Int::class.java, guest.id)).isEqualTo(4)
	}

	@ParameterizedTest
	@CsvSource(
		"2026-11-01, 2026-11-01, 2, stay_period_check",
		"2026-11-03, 2026-11-01, 2, stay_period_check",
		"2026-11-01, 2026-12-02, 2, stay_period_check",
		"2026-11-01, 2026-11-02, 0, stay_guest_count_check",
		"2026-11-01, 2026-11-02, 21, stay_guest_count_check",
	)
	fun `0박, 31박 이상, 1~20명이 아닌 인원은 DB CHECK 제약이 저장을 막고 배제 제약 위반으로 보지 않는다`(
		checkIn: LocalDate,
		checkOut: LocalDate,
		guestCount: Int,
		constraint: String,
	) {
		assertThatThrownBy { stayRepository.saveAndFlush(Stay(room, guest, checkIn, checkOut, guestCount, 0)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(constraint)).isTrue()
				assertThat(it.violates(Stay.ROOM_PERIOD_EXCLUSION_CONSTRAINT)).isFalse()
			}
	}

	@Test
	fun `30박과 20명은 DB 제약을 통과한다`() {
		val saved = stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_IN.plusDays(Stay.MAX_NIGHTS), 20, ROOM_RATE))

		assertThat(saved.id).isNotNull()
	}

	@Test
	fun `겹침 확인은 같은 객실에서 체크인 날짜 이상 체크아웃 날짜 미만의 기간으로 비교한다`() {
		stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE))

		assertThat(overlaps(room, CHECK_IN.plusDays(1), CHECK_OUT.plusDays(1))).isTrue()
		assertThat(overlaps(room, CHECK_IN.minusDays(1), CHECK_IN.plusDays(1))).isTrue()
		assertThat(overlaps(room, CHECK_OUT, CHECK_OUT.plusDays(1))).isFalse()
		assertThat(overlaps(room, CHECK_IN.minusDays(1), CHECK_IN)).isFalse()
		assertThat(overlaps(otherRoom, CHECK_IN, CHECK_OUT)).isFalse()
		stayRepository.saveAndFlush(Stay(room, guest, CHECK_OUT, CHECK_OUT.plusDays(2), 2, ROOM_RATE))
		assertThat(stayRepository.findOverlappedRoomIds(listOf(checkNotNull(room.id), checkNotNull(otherRoom.id)), CHECK_IN, CHECK_OUT.plusDays(2)))
			.containsExactly(room.id)
	}

	@Test
	fun `id와 객실의 호텔이 모두 맞을 때만 이용을 찾는다`() {
		val otherHotel = entityManager.persistAndFlush(Hotel("어반스테이 $suffix", "부산 $suffix", PHONE, null))
		val stay = stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE))

		assertThat(stayRepository.findByIdAndRoomHotelId(checkNotNull(stay.id), checkNotNull(hotel.id))?.id).isEqualTo(stay.id)
		assertThat(stayRepository.findByIdAndRoomHotelId(stay.id!!, checkNotNull(otherHotel.id))).isNull()
	}

	@Test
	fun `취소는 취소되지 않은 이용에만 취소 시각, 처리 계정과 이름, 사유를 한 번 기록하고 바뀐 행 수를 돌려준다`() {
		val stayId = checkNotNull(stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE)).id)

		assertThat(stayRepository.cancel(stayId, hotelAdmin, hotelAdmin.name, REASON, CANCELED_AT)).isEqualTo(1)
		assertThat(stayRepository.cancel(stayId, hotelAdmin, "다른 이름", null, CANCELED_AT.plusSeconds(60))).isZero()

		val found = stayRepository.findById(stayId).orElseThrow()
		assertThat(listOf(found.canceledAt, found.canceledBy?.id, found.canceledByName, found.cancelReason, found.updatedAt))
			.containsExactly(CANCELED_AT, hotelAdmin.id, hotelAdmin.name, REASON, CANCELED_AT)
	}

	@Test
	fun `취소한 이용은 배제 제약과 겹침 확인에서 빠져 같은 기간을 다시 저장할 수 있다`() {
		val canceledId = checkNotNull(stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE)).id)
		stayRepository.cancel(canceledId, hotelAdmin, hotelAdmin.name, null, CANCELED_AT)

		assertThat(overlaps(room, CHECK_IN, CHECK_OUT)).isFalse()
		stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE))
		assertThat(overlaps(room, CHECK_IN, CHECK_OUT)).isTrue()
		assertThatThrownBy { stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE)) }
			.isInstanceOfSatisfying(DataIntegrityViolationException::class.java) {
				assertThat(it.violates(Stay.ROOM_PERIOD_EXCLUSION_CONSTRAINT)).isTrue()
			}
	}

	@ParameterizedTest
	@CsvSource(
		delimiter = '|',
		quoteCharacter = '"',
		value = [
			"canceled_at = now() | stay_cancellation_check",
			"canceled_by_id = :admin, canceled_by_name = '마스터' | stay_cancellation_check",
			"cancel_reason = '사유' | stay_cancellation_check",
			"canceled_at = now(), canceled_by_id = :admin, canceled_by_name = ' 마스터' | stay_canceled_by_name_check",
			"canceled_at = now(), canceled_by_id = :admin, canceled_by_name = '마스터', cancel_reason = '' | stay_cancel_reason_check",
			"canceled_at = now(), canceled_by_id = :admin, canceled_by_name = '마스터', cancel_reason = '사유 ' | stay_cancel_reason_check",
		],
	)
	fun `취소 시각·처리 계정·이름 중 일부만 있거나, 취소 없이 사유만 있거나, 이름·사유가 정리되지 않으면 DB CHECK 제약이 막는다`(
		assignments: String,
		constraint: String,
	) {
		val stayId = checkNotNull(stayRepository.saveAndFlush(Stay(room, guest, CHECK_IN, CHECK_OUT, 2, ROOM_RATE)).id)

		assertThatThrownBy { jdbcTemplate.update("update stay set ${assignments.replace(":admin", hotelAdmin.id.toString())} where id = ?", stayId) }
			.isInstanceOf(DataIntegrityViolationException::class.java)
			.hasMessageContaining(constraint)
	}

	private fun overlaps(room: Room, checkIn: LocalDate, checkOut: LocalDate): Boolean =
		stayRepository.findOverlappedRoomIds(listOf(checkNotNull(room.id)), checkIn, checkOut).isNotEmpty()

	private fun room(name: String): Room = Room(hotel, name, roomType, null, null)

	companion object {
		private const val PHONE = "02-1234-5678"
		private const val ROOM_RATE = 100000
		private val CHECK_IN = LocalDate.of(2026, 11, 1)
		private val CHECK_OUT = LocalDate.of(2026, 11, 3)
		private val CANCELED_AT = Instant.parse("2026-10-31T01:00:00Z")
		private const val REASON = "고객 요청"
		private const val COUNT_STAYS = "select count(*) from stay where guest_id = ?"
	}
}
