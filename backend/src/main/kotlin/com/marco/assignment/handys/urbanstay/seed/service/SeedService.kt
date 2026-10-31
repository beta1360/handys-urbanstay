package com.marco.assignment.handys.urbanstay.seed.service

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.service.HotelMasterService
import com.marco.assignment.handys.urbanstay.account.service.HotelOperatorService
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.guest.service.GuestService
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import com.marco.assignment.handys.urbanstay.member.entity.Member
import com.marco.assignment.handys.urbanstay.member.service.MemberService
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.service.RoomService
import com.marco.assignment.handys.urbanstay.room.service.RoomTypeService
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import com.marco.assignment.handys.urbanstay.stay.service.StayService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.LocalTime

@Service
class SeedService(
	private val hotelService: HotelService,
	private val hotelMasterService: HotelMasterService,
	private val hotelOperatorService: HotelOperatorService,
	private val roomTypeService: RoomTypeService,
	private val roomService: RoomService,
	private val memberService: MemberService,
	private val guestService: GuestService,
	private val guestRepository: GuestRepository,
	private val stayService: StayService,
	private val stayRepository: StayRepository,
	private val clock: Clock,
) {

	private val log = LoggerFactory.getLogger(javaClass)

	@Transactional
	fun seedIfEmpty() {
		if (!hotelService.getHotels(null, 0, 1).isEmpty) {
			return
		}
		val today = LocalDate.now(clock)
		val members = MEMBER_NAMES.mapIndexed { index, name ->
			memberService.signup("member${index + 1}@$DOMAIN", PASSWORD, name, "010-2000-%04d".format(index + 1))
		}
		val stayCount = HOTELS.withIndex().sumOf { (index, hotel) -> seedHotel(index, hotel, members, today) }
		log.info("Seeded local data: hotels={}, members={}, stays={}", HOTELS.size, members.size, stayCount)
	}

	private fun seedHotel(hotelIndex: Int, seed: HotelSeed, members: List<Member>, today: LocalDate): Int {
		val number = hotelIndex + 1
		val hotel = hotelService.create(
			seed.name, seed.address, seed.phone, seed.description, "master$number@$DOMAIN", "${seed.label} 마스터", PASSWORD,
		)
		val hotelId = checkNotNull(hotel.id)
		val master = hotelMasterService.getMaster(hotelId)
		val operators = OPERATOR_SUFFIXES.map {
			hotelOperatorService.create(hotelId, "operator$number$it@$DOMAIN", "${seed.label} 운영자${it.uppercase()}", PASSWORD)
		}
		val roomTypes = ROOM_TYPES.zip(seed.roomRates) { type, rate ->
			roomTypeService.create(hotelId, type.name, type.capacity, rate, type.checkInTime, type.checkOutTime)
		}
		val rooms = ROOMS.take(seed.roomCount).map {
			roomService.create(hotelId, checkNotNull(master.id), it.name, checkNotNull(roomTypes[it.typeIndex].id), it.floor, null)
		}
		val walkIns = WALK_IN_NAMES.mapIndexed { index, name ->
			guestRepository.saveAndFlush(Guest(hotel, name, "010-3${number}00-%04d".format(index + 1), "walkin$number${index + 1}@$DOMAIN"))
		}
		val stays = STAYS + seed.cancellations
		var memberSlot = 0
		var walkInSlot = 0
		val saved = stays.map { stay ->
			val guest = if (stay.member) {
				guestService.getOrCreate(hotelId, members[(hotelIndex * MEMBER_SHIFT + memberSlot++) % members.size])
			} else {
				walkIns[walkInSlot++ % walkIns.size]
			}
			val checkIn = today.plusDays(stay.startOffset)
			val roomRate = roomTypes[ROOMS[stay.roomIndex].typeIndex].roomRate
			stayRepository.saveAndFlush(Stay(rooms[stay.roomIndex], guest, checkIn, checkIn.plusDays(stay.nights), stay.guestCount, roomRate))
		}
		stays.zip(saved).forEach { (seedStay, stay) ->
			seedStay.cancellation?.let { cancel(hotelId, stay, operators.first(), it, today) }
		}
		val admins = operators + master
		STATUS_PATHS.forEach { (roomIndex, path) ->
			path.zipWithNext().forEachIndexed { step, (from, to) ->
				roomService.changeStatus(hotelId, checkNotNull(rooms[roomIndex].id), checkNotNull(admins[step % admins.size].id), from, to)
			}
		}
		return saved.size
	}

	private fun cancel(hotelId: Long, stay: Stay, canceledBy: HotelAdmin, cancellation: CancellationSeed, today: LocalDate) {
		val stayId = checkNotNull(stay.id)
		if (stay.checkOutDate > today) {
			stayService.cancel(hotelId, stayId, checkNotNull(canceledBy.id), cancellation.reason)
			return
		}
		val canceledAt = stay.checkInDate.minusDays(PAST_CANCEL_DAYS_BEFORE_CHECK_IN).atTime(PAST_CANCEL_TIME).atZone(clock.zone).toInstant()
		stayRepository.cancel(stayId, canceledBy, canceledBy.name, cancellation.reason, canceledAt)
	}

	private data class HotelSeed(
		val label: String,
		val name: String,
		val address: String,
		val phone: String,
		val description: String,
		val roomRates: List<Int>,
		val roomCount: Int,
		val cancellations: List<StaySeed>,
	)

	private data class RoomTypeSeed(val name: String, val capacity: Int, val checkInTime: LocalTime, val checkOutTime: LocalTime)

	private data class RoomSeed(val name: String, val floor: Int, val typeIndex: Int)

	private data class StaySeed(
		val roomIndex: Int,
		val startOffset: Long,
		val nights: Long,
		val guestCount: Int,
		val member: Boolean,
		val cancellation: CancellationSeed? = null,
	)

	private data class CancellationSeed(val reason: String?)

	companion object {
		const val PASSWORD = "Test1234!"
		const val DOMAIN = "urbanstay.test"
		private const val MEMBER_SHIFT = 3
		private const val PAST_CANCEL_DAYS_BEFORE_CHECK_IN = 3L
		private val PAST_CANCEL_TIME: LocalTime = LocalTime.of(10, 0)
		private val OPERATOR_SUFFIXES = listOf("a", "b")

		private val MEMBER_NAMES = listOf("김민준", "이서연", "박도윤", "최하은", "정시우", "강지우", "조서준", "윤하린", "장예준", "임수아")
		private val WALK_IN_NAMES = listOf("한지민", "오세훈", "서유진", "신동현")

		private val ROOM_TYPES = listOf(
			RoomTypeSeed("스탠다드", 2, LocalTime.of(15, 0), LocalTime.of(11, 0)),
			RoomTypeSeed("디럭스", 3, LocalTime.of(15, 0), LocalTime.of(12, 0)),
			RoomTypeSeed("스위트", 4, LocalTime.of(14, 0), LocalTime.of(12, 0)),
		)

		private val ROOMS = listOf(
			RoomSeed("101", 1, 0),
			RoomSeed("102", 1, 0),
			RoomSeed("103", 1, 0),
			RoomSeed("201", 2, 1),
			RoomSeed("202", 2, 1),
			RoomSeed("203", 2, 1),
			RoomSeed("301", 3, 2),
			RoomSeed("302", 3, 2),
			RoomSeed("104", 1, 0),
			RoomSeed("204", 2, 1),
			RoomSeed("105", 1, 0),
			RoomSeed("205", 2, 1),
		)

		private val STAYS = listOf(
			StaySeed(0, -40, 3, 2, member = true),
			StaySeed(0, -2, 4, 2, member = false),
			StaySeed(1, -30, 2, 1, member = false),
			StaySeed(1, -5, 5, 2, member = true),
			StaySeed(2, -20, 3, 2, member = true),
			StaySeed(2, 1, 2, 2, member = false),
			StaySeed(3, -12, 3, 3, member = false),
			StaySeed(3, 0, 3, 2, member = true),
			StaySeed(4, 15, 2, 3, member = true),
			StaySeed(6, 5, 3, 4, member = true),
			StaySeed(7, 5, 3, 3, member = false),
			StaySeed(5, 33, 3, 2, member = false),
		)

		private val STATUS_PATHS = listOf(
			0 to listOf(RoomStatus.VACANT, RoomStatus.RESERVED, RoomStatus.OCCUPIED),
			1 to listOf(RoomStatus.VACANT, RoomStatus.RESERVED, RoomStatus.OCCUPIED, RoomStatus.MAINTENANCE),
			2 to listOf(RoomStatus.VACANT, RoomStatus.RESERVED),
			3 to listOf(RoomStatus.VACANT, RoomStatus.RESERVED, RoomStatus.OCCUPIED),
			7 to listOf(RoomStatus.VACANT, RoomStatus.MAINTENANCE),
		)

		private val HOTELS = listOf(
			HotelSeed(
				"강남", "어반스테이 강남", "서울특별시 강남구 테헤란로 123", "02-555-0101", "강남역 도보 5분 거리의 비즈니스 호텔입니다.",
				listOf(89000, 129000, 219000), 12,
				listOf(
					StaySeed(4, -25, 2, 2, member = false, cancellation = CancellationSeed("고객 요청")),
					StaySeed(1, 8, 2, 2, member = true, cancellation = CancellationSeed("일정 변경")),
				),
			),
			HotelSeed(
				"홍대", "어반스테이 홍대", "서울특별시 마포구 양화로 45", "02-333-0202", "홍대입구역 앞 여행객을 위한 호텔입니다.",
				listOf(79000, 115000, 189000), 10,
				listOf(StaySeed(3, 10, 2, 2, member = true, cancellation = CancellationSeed(null))),
			),
			HotelSeed(
				"해운대", "어반스테이 해운대", "부산광역시 해운대구 해운대해변로 77", "051-740-0303", "해운대 해변이 보이는 리조트형 호텔입니다.",
				listOf(99000, 149000, 259000), 8,
				listOf(StaySeed(0, -35, 2, 2, member = false, cancellation = CancellationSeed("중복 예약"))),
			),
		)
	}
}
