package com.marco.assignment.handys.urbanstay.stay.controller.app

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.NOW
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.TODAY
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.exception.GuestErrorCode
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.member.entity.Member
import com.marco.assignment.handys.urbanstay.member.repository.MemberRepository
import com.marco.assignment.handys.urbanstay.member.service.MemberPrincipal
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.exception.StayErrorCode
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.MvcResult
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.node.ObjectNode
import java.nio.charset.StandardCharsets
import java.sql.Timestamp
import java.time.LocalDate
import java.time.LocalTime
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class, FixedClockConfiguration::class)
class StayAppControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var roomRepository: RoomRepository

	@Autowired
	private lateinit var roomTypeRepository: RoomTypeRepository

	private val roomTypes = mutableMapOf<Pair<Long, String>, RoomType>()

	@Autowired
	private lateinit var guestRepository: GuestRepository

	@Autowired
	private lateinit var stayRepository: StayRepository

	@Autowired
	private lateinit var memberRepository: MemberRepository

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)

	private val createdHotelIds = mutableListOf<Long>()

	private lateinit var hotel: Hotel

	private lateinit var room: Room

	private lateinit var otherRoom: Room

	private lateinit var guest: Guest

	private lateinit var otherHotel: Hotel

	private lateinit var hotelAdmin: HotelAdmin

	private lateinit var otherGuest: Guest

	private lateinit var member: Member

	private lateinit var newMember: Member

	private val createdMemberIds = mutableListOf<Long>()

	@BeforeEach
	fun createRoomsAndGuests() {
		hotel = saveHotel("어반스테이 $suffix")
		otherHotel = saveHotel("다른 호텔 $suffix")
		room = saveRoom(hotel, "101")
		otherRoom = saveRoom(hotel, "102")
		guest = guestRepository.save(Guest(hotel, "홍길동", PHONE, EMAIL))
		otherGuest = guestRepository.save(Guest(otherHotel, "다른 호텔 이용객", PHONE, EMAIL))
		hotelAdmin = hotelAdminRepository.save(HotelAdmin(hotel, "master-$suffix@test.local", "password-hash", "계정", HotelAdminRole.MASTER))
		member = saveMember("member-$suffix@test.local", "회원 홍길동", "01012345678")
		newMember = saveMember("new-$suffix@test.local", "새 회원", "010-7777-6666")
	}

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
		memberRepository.deleteAllByIdInBatch(createdMemberIds)
	}

	@Test
	fun `객실 유형 목록은 그 호텔의 유형마다 이름순(숫자 크기)으로 유형 정보, 객실 수, 그 기간·인원으로 예약할 수 있는 객실 수를 상태와 관계없이 보여주고 객실 없는 유형도 보여준다`() {
		roomType(hotel, "10인실", 10)
		roomType(hotel, "2인실", 2)
		roomType(hotel, "빈 유형")
		saveRoom(hotel, "103")
		val deluxe = saveRoom(hotel, "201", "디럭스")
		saveRoom(hotel, "301", "10인실")
		saveRoom(hotel, "302", "2인실")
		saveRoom(hotel, "401", "deluxe")
		saveRoom(hotel, "402", "Deluxe")
		saveRoom(otherHotel, "101")
		jdbcTemplate.update(UPDATE_ROOM_STATUS, RoomStatus.MAINTENANCE.name, otherRoom.id)
		saveStay(room, TODAY.plusDays(2), TODAY.plusDays(4))
		saveStay(otherRoom, TODAY.plusDays(1), TODAY.plusDays(3))
		saveStay(otherRoom, TODAY.plusDays(5), TODAY.plusDays(6))
		cancelStay(saveStay(deluxe, TODAY.plusDays(3), TODAY.plusDays(5)))

		val result = roomTypes(checkNotNull(hotel.id), *roomTypeParams(TODAY.plusDays(3), TODAY.plusDays(5), 3)).andReturn()
		val data = result.andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(
			roomTypesJson(
				listOf("2인실", 1, 0),
				listOf("10인실", 1, 1),
				listOf("deluxe", 1, 1),
				listOf("Deluxe", 1, 1),
				listOf("디럭스", 1, 1),
				listOf("빈 유형", 0, 0),
				listOf(STANDARD, 3, 2),
			),
		)
		assertThat(result.request.getSession(false)).isNull()
		assertThat(result.response.cookies).isEmpty()
	}

	@Test
	fun `객실 유형 목록은 파라미터가 빠졌거나 형식이 틀렸거나 인원이 1보다 적으면 그 파라미터로, 기간 규칙을 어기면 틀린 날짜들로 400 응답한다`() {
		val hotelId = checkNotNull(hotel.id)

		roomTypes(hotelId, "checkInDate" to TODAY.toString(), "guestCount" to "1").andExpectError(CommonErrorCode.INVALID_INPUT, "checkOutDate" to message("validation.required"))
		listOf("11/2/26", "2026-11-02+09:00", "20261102").forEach { date ->
			roomTypes(hotelId, "checkInDate" to date, "checkOutDate" to TODAY.plusDays(1).toString(), "guestCount" to "1")
				.andExpectError(CommonErrorCode.INVALID_INPUT, "checkInDate" to message("validation.type"))
		}
		roomTypes(hotelId, *roomTypeParams(TODAY.minusDays(1), TODAY.minusDays(1), 0)).andExpectError(CommonErrorCode.INVALID_INPUT, "guestCount" to message(MIN, "value" to "1"))
		roomTypes(hotelId, *roomTypeParams(TODAY.minusDays(1), TODAY.minusDays(1), 1)).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"checkInDate" to message("validation.today-or-later"),
			"checkOutDate" to message("validation.after-check-in"),
		)
		roomTypes(hotelId, *roomTypeParams(TODAY, TODAY.plusDays(31), 1)).andExpectError(CommonErrorCode.INVALID_INPUT, "checkOutDate" to message("validation.max-nights", "max" to "30"))
	}

	@Test
	fun `없는 호텔의 객실 유형 목록은 404 HOTEL_NOT_FOUND로, 유형이 없는 호텔은 빈 목록으로 응답한다`() {
		roomTypes(MISSING_ID, *roomTypeParams(TODAY, TODAY.plusDays(1), 1)).andExpectError(HotelErrorCode.HOTEL_NOT_FOUND)

		val data = roomTypes(checkNotNull(otherHotel.id), *roomTypeParams(TODAY, TODAY.plusDays(1), 1)).andReturn().andExpectSuccess(HttpStatus.OK)
		assertThat(data.isArray).isTrue()
		assertThat(data.isEmpty).isTrue()
	}

	@Test
	fun `객실 유형 목록 문서는 게스트 앱 그룹의 stay 태그에 필수 파라미터, HOTEL_NOT_FOUND 예시와 페이지 없는 목록 응답을 보여준다`() {
		val docs = json(mockMvc.get(APP_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val operation = docs["paths"]["${ApiPaths.APP}/hotels/{hotelId}/room-types"]["get"]
		val schemas = docs["components"]["schemas"]
		val dataSchema = schemas[operation["responses"]["200"]["content"][JSON]["schema"]["\$ref"].stringValue().substringAfterLast('/')]["properties"]["data"]

		assertThat(operation["operationId"].stringValue()).isEqualTo("getHotelRoomTypes")
		assertThat(operation["tags"].values().map { it.stringValue() }).containsExactly("stay")
		assertThat(operation["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "404", "500")
		assertThat(errorCodes(operation, HttpStatus.NOT_FOUND)).containsExactly(HotelErrorCode.HOTEL_NOT_FOUND.code)
		assertThat(operation["parameters"].values().map { listOf(it["name"].stringValue(), it["required"].booleanValue().toString(), it["schema"]["format"]?.stringValue()) })
			.containsExactly(listOf("hotelId", "true", "int64"), listOf("checkInDate", "true", "date"), listOf("checkOutDate", "true", "date"), listOf("guestCount", "true", "int32"))
		assertThat(dataSchema["type"].values().map { it.stringValue() }).contains("array")
		assertThat(dataSchema["items"]["\$ref"].stringValue()).endsWith("/StayRoomTypeAppResponse")
		assertThat(schemas["StayRoomTypeAppResponse"]["properties"].propertyNames()).containsExactlyElementsOf(ROOM_TYPE_FIELDS)
		assertThat(required(schemas["StayRoomTypeAppResponse"])).containsExactlyInAnyOrderElementsOf(ROOM_TYPE_FIELDS)
	}

	@Test
	fun `회원이 그 호텔에 없던 전화번호로 유형을 예약하면 이름순(숫자 크기) 첫 객실을 상태와 관계없이 배정하고 회원 정보로 이용객을 만들어 연결하며 201로 호수 없이 응답한다`() {
		val first = saveRoom(hotel, "99")
		jdbcTemplate.update(UPDATE_ROOM_STATUS, RoomStatus.MAINTENANCE.name, first.id)
		val kim = saveMember("Kim-$suffix@Example.com", " 김철수 ", " 010-9999-8888 ")

		val data = reserve(body(TODAY, TODAY.plusDays(2), guestCount = CAPACITY), kim).andReturn().andExpectSuccess(HttpStatus.CREATED)

		val id = data["id"].longValue()
		assertThat(data).isEqualTo(stayJson(id, TODAY, TODAY.plusDays(2), CAPACITY, "김철수"))
		assertThat(stayRooms()).containsExactly("99")
		assertThat(jdbcTemplate.queryForList(SELECT_STAY_AMOUNTS, id).single().values.map { (it as Number).toLong() })
			.containsExactly(ROOM_RATE.toLong(), 2L, ROOM_RATE * 2L, 0L, ROOM_RATE * 2L)
		assertThat(guests(hotel)).containsExactly(listOf("홍길동", PHONE, EMAIL), listOf("김철수", "010-9999-8888", "kim-$suffix@example.com"))
		assertThat(jdbcTemplate.queryForObject(SELECT_GUEST_MEMBER_OF_STAY, Long::class.java, id)).isEqualTo(kim.id)
		assertThat(jdbcTemplate.queryForObject(SELECT_GUEST_CREATED_AT, Timestamp::class.java, id)?.toInstant()).isEqualTo(NOW)
		assertThat(jdbcTemplate.queryForObject(SELECT_ROOM_STATUS, String::class.java, first.id)).isEqualTo(RoomStatus.MAINTENANCE.name)
	}

	@Test
	fun `같은 호텔에 숫자가 같은 전화번호의 이용객이 있으면 그 이용객으로 예약해 회원과 연결하고 이름과 이메일은 바꾸지 않는다`() {
		val data = reserve(body(TODAY, TODAY.plusDays(1))).andReturn().andExpectSuccess(HttpStatus.CREATED)
		reserve(body(TODAY.plusDays(1), TODAY.plusDays(2))).andReturn().andExpectSuccess(HttpStatus.CREATED)

		assertThat(data["guest"]["name"].stringValue()).isEqualTo("홍길동")
		assertThat(guests(hotel)).containsExactly(listOf("홍길동", PHONE, EMAIL))
		assertThat(guests(otherHotel)).containsExactly(listOf("다른 호텔 이용객", PHONE, EMAIL))
		assertThat(jdbcTemplate.queryForObject(SELECT_GUEST_ID_OF_STAY, Long::class.java, data["id"].longValue())).isEqualTo(guest.id)
		assertThat(jdbcTemplate.queryForList(SELECT_GUEST_MEMBER, Long::class.java, guest.id, otherGuest.id)).containsExactly(member.id, null)
	}

	@Test
	fun `로그인하지 않고 예약하면 401 UNAUTHORIZED로 응답하고 저장하지 않는다`() {
		reserve(body(TODAY, TODAY.plusDays(1)), null).andExpectError(CommonErrorCode.UNAUTHORIZED)

		assertThat(stayRooms()).isEmpty()
	}

	@Test
	fun `같은 전화번호의 이용객이 이미 다른 회원과 연결되어 있으면 409 GUEST_LINKED_TO_OTHER_MEMBER로 응답하고 예약하지 않는다`() {
		jdbcTemplate.update(UPDATE_GUEST_MEMBER, newMember.id, guest.id)

		reserve(body(TODAY, TODAY.plusDays(1))).andExpectError(GuestErrorCode.GUEST_LINKED_TO_OTHER_MEMBER)

		assertThat(stayRooms()).isEmpty()
		assertThat(jdbcTemplate.queryForList(SELECT_GUEST_MEMBER, Long::class.java, guest.id, guest.id)).containsExactly(newMember.id)
	}

	@Test
	fun `내 이용 목록은 회원과 연결된 모든 호텔 이용객의 이용을 취소 포함 체크인 늦은 순(같으면 id 내림차순)으로 주고 로그인하지 않으면 401이다`() {
		jdbcTemplate.update(UPDATE_GUEST_MEMBER, member.id, guest.id)
		jdbcTemplate.update(UPDATE_GUEST_MEMBER, member.id, otherGuest.id)
		val stranger = guestRepository.save(Guest(hotel, "다른 사람", "010-3333-4444", EMAIL))
		val first = saveStay(room, TODAY.plusDays(1), TODAY.plusDays(3))
		val canceled = saveStay(otherRoom, TODAY.plusDays(1), TODAY.plusDays(2)).also(::cancelStay)
		val other = saveStay(saveRoom(otherHotel, "501", "디럭스"), TODAY.plusDays(5), TODAY.plusDays(6), otherGuest)
		saveStay(otherRoom, TODAY.plusDays(10), TODAY.plusDays(11), stranger)

		val data = myStays(member).andReturn().andExpectSuccess(HttpStatus.OK)

		assertThat(data["totalElements"].longValue()).isEqualTo(3)
		assertThat(data["items"].values().map { it["id"].longValue() }).containsExactly(other.id, canceled.id, first.id)
		assertThat(data["items"][0]).isEqualTo(
			json(
				jsonMapper.writeValueAsString(
					linkedMapOf(
						"id" to other.id,
						"hotel" to linkedMapOf("id" to otherHotel.id, "name" to otherHotel.name),
						"roomType" to linkedMapOf("id" to roomType(otherHotel, "디럭스").id, "name" to "디럭스"),
						"checkInDate" to TODAY.plusDays(5).toString(),
						"checkOutDate" to TODAY.plusDays(6).toString(),
						"guestCount" to 2,
						"roomRate" to ROOM_RATE,
						"nights" to 1,
						"baseAmount" to ROOM_RATE,
						"discountAmount" to 0,
						"totalAmount" to ROOM_RATE,
						"canceledAt" to null,
					),
				),
			),
		)
		assertThat(data["items"].values().map { it["canceledAt"].isNull }).containsExactly(true, false, true)
		assertThat(myStays(newMember).andReturn().andExpectSuccess(HttpStatus.OK)["items"].isEmpty).isTrue()
		myStays(null).andExpectError(CommonErrorCode.UNAUTHORIZED)
	}

	@ParameterizedTest
	@CsvSource(
		"0, 0, , validation.after-check-in",
		"2, 1, , validation.after-check-in",
		"0, 31, , validation.max-nights",
		"-1, 1, validation.today-or-later, ",
		"-2, -2, validation.today-or-later, validation.after-check-in",
	)
	fun `체크아웃이 체크인보다 뒤가 아니거나 30박을 넘거나 체크인이 한국 시간 오늘보다 앞이면 그 항목들의 오류로 400 응답하고 이용객도 등록하지 않는다`(
		checkIn: Long,
		checkOut: Long,
		checkInKey: String?,
		checkOutKey: String?,
	) {
		val expected = listOfNotNull(checkInKey?.let { "checkInDate" to message(it) }, checkOutKey?.let { "checkOutDate" to message(it, "max" to "30") })

		reserve(body(TODAY.plusDays(checkIn), TODAY.plusDays(checkOut)), newMember).andExpectError(CommonErrorCode.INVALID_INPUT, *expected.toTypedArray())

		assertThat(stayRooms()).isEmpty()
		assertThat(guests(hotel)).hasSize(1)
	}

	@Test
	fun `인원이 1보다 적으면 guestCount로, 유형·호텔 항목이 빠졌거나 틀리면 그 경로로, 없앤 이용객 항목을 보내면 알 수 없는 항목으로 400 응답하고 저장하지 않는다`() {
		reserve(body(TODAY, TODAY.plusDays(1), guestCount = 0)).andExpectError(CommonErrorCode.INVALID_INPUT, "guestCount" to message(MIN, "value" to "1"))
		reserve(body(TODAY, TODAY.plusDays(1)) - "roomTypeId").andExpectError(CommonErrorCode.INVALID_INPUT, "roomTypeId" to message("validation.required"))
		reserve(body(TODAY, TODAY.plusDays(1)) - "hotelId").andExpectError(CommonErrorCode.INVALID_INPUT, "hotelId" to message("validation.required"))
		reserve(body(TODAY, TODAY.plusDays(1)) + ("guest" to mapOf("name" to "홍길동", "phone" to PHONE, "email" to EMAIL)))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "guest" to message("validation.unknown-field"))

		assertThat(stayRooms()).isEmpty()
		assertThat(guests(hotel)).hasSize(1)
	}

	@Test
	fun `겹치는 이용이 있는 객실은 건너뛰고 다음 이름순 객실을 배정하며 빈 객실이 없거나 인원이 유형의 최대 인원보다 많거나 객실 없는 유형이면 409 ROOM_TYPE_UNAVAILABLE로 응답한다`() {
		saveRoom(hotel, "103")
		val emptyType = roomType(hotel, "빈 유형")
		saveStay(room, TODAY.plusDays(5), TODAY.plusDays(7))
		cancelStay(saveStay(otherRoom, TODAY.plusDays(5), TODAY.plusDays(7)))

		reserve(body(TODAY.plusDays(4), TODAY.plusDays(6), guestCount = 3)).andReturn().andExpectSuccess(HttpStatus.CREATED)
		reserve(body(TODAY.plusDays(5), TODAY.plusDays(7), guestCount = CAPACITY)).andReturn().andExpectSuccess(HttpStatus.CREATED)
		reserve(body(TODAY.plusDays(5), TODAY.plusDays(6), guestCount = 1), newMember).andExpectError(RoomErrorCode.ROOM_TYPE_UNAVAILABLE)
		reserve(body(TODAY.plusDays(7), TODAY.plusDays(9))).andReturn().andExpectSuccess(HttpStatus.CREATED)
		reserve(body(TODAY.plusDays(20), TODAY.plusDays(21), guestCount = CAPACITY + 1), newMember).andExpectError(RoomErrorCode.ROOM_TYPE_UNAVAILABLE)
		reserve(body(TODAY.plusDays(20), TODAY.plusDays(21), roomTypeId = emptyType.id), newMember).andExpectError(RoomErrorCode.ROOM_TYPE_UNAVAILABLE)

		assertThat(stayRooms()).containsExactly("101", "102", "102", "103", "101")
		assertThat(guests(hotel)).hasSize(1)
	}

	@Test
	fun `없는 유형, 다른 호텔의 유형이거나 없는 호텔이면 404 ROOM_TYPE_NOT_FOUND로 응답한다`() {
		saveRoom(otherHotel, "301", "디럭스")

		listOf(hotel.id to MISSING_ID, hotel.id to roomType(otherHotel, "디럭스").id, MISSING_ID to roomType(hotel).id).forEach { (hotelId, roomTypeId) ->
			reserve(body(TODAY, TODAY.plusDays(1), roomTypeId = roomTypeId) + ("hotelId" to hotelId), newMember).andExpectError(RoomErrorCode.ROOM_TYPE_NOT_FOUND)
		}

		assertThat(stayRooms()).isEmpty()
		assertThat(guests(hotel)).hasSize(1)
	}

	@Test
	fun `게스트 앱에서 지운 호텔 객실 목록과 객실의 예약된 기간 API는 404 NOT_FOUND로 응답하고 문서에도 없다`() {
		listOf("${ApiPaths.APP}/hotels/${hotel.id}/rooms", "${ApiPaths.APP}/rooms/${room.id}/reserved-periods").forEach { path ->
			mockMvc.get(path).andExpectError(CommonErrorCode.NOT_FOUND)
		}

		val docs = json(mockMvc.get(APP_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(docs["paths"].propertyNames()).doesNotContain("${ApiPaths.APP}/hotels/{hotelId}/rooms", "${ApiPaths.APP}/rooms/{roomId}/reserved-periods")
		assertThat(docs["components"]["schemas"].propertyNames()).doesNotContain("RoomAppResponse", "StayReservedPeriodAppResponse", "StayRoomAppResponse")
		assertThat(docs.path("tags").values().map { it["name"].stringValue() }).doesNotContain("room")
	}

	@Test
	fun `예약과 내 이용 API 문서는 게스트 앱 그룹의 stay 태그에 로그인 필요(401)와 에러 예시, 이용객 없는 요청을 보여준다`() {
		val docs = json(mockMvc.get(APP_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val create = docs["paths"][STAYS]["post"]
		val myStays = docs["paths"][MY_STAYS]["get"]
		val schemas = docs["components"]["schemas"]

		assertThat(create["operationId"].stringValue()).isEqualTo("createStay")
		assertThat(create["tags"].values().map { it.stringValue() }).containsExactly("stay")
		assertThat(create["responses"].propertyNames()).containsExactlyInAnyOrder("201", "400", "401", "404", "409", "500")
		assertThat(errorCodes(create, HttpStatus.UNAUTHORIZED)).containsExactly(CommonErrorCode.UNAUTHORIZED.code)
		assertThat(errorCodes(create, HttpStatus.NOT_FOUND)).containsExactly(RoomErrorCode.ROOM_TYPE_NOT_FOUND.code)
		assertThat(errorCodes(create, HttpStatus.CONFLICT)).containsExactlyInAnyOrder(
			RoomErrorCode.ROOM_TYPE_UNAVAILABLE.code,
			GuestErrorCode.GUEST_LINKED_TO_OTHER_MEMBER.code,
			StayErrorCode.STAY_PERIOD_OVERLAPPED.code,
		)
		assertThat(required(schemas["StayCreateAppRequest"])).containsExactlyInAnyOrder("hotelId", "roomTypeId", "checkInDate", "checkOutDate", "guestCount")
		assertThat(schemas.propertyNames()).doesNotContain("StayGuestCreateAppRequest")
		assertThat(schemas["StayAppResponse"]["properties"].propertyNames()).containsExactly(
			"id", "hotel", "roomType", "checkInDate", "checkOutDate", "guestCount", "roomRate", "nights", "baseAmount", "discountAmount", "totalAmount", "guest",
		)

		assertThat(myStays["operationId"].stringValue()).isEqualTo("getMyStays")
		assertThat(myStays["tags"].values().map { it.stringValue() }).containsExactly("stay")
		assertThat(myStays["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "500")
		assertThat(myStays["parameters"].values().map { it["name"].stringValue() }).containsExactly("page", "size")
		assertThat(schemas["StayMyAppResponse"]["properties"].propertyNames()).containsExactly(
			"id", "hotel", "roomType", "checkInDate", "checkOutDate", "guestCount", "roomRate", "nights", "baseAmount", "discountAmount", "totalAmount", "canceledAt",
		)
	}

	private fun reserve(body: Map<String, Any?>, member: Member? = this.member): ResultActionsDsl =
		mockMvc.post(STAYS) {
			member?.let { with(user(MemberPrincipal.from(it))) }
			contentType = MediaType.APPLICATION_JSON
			content = jsonMapper.writeValueAsString(body)
		}

	private fun myStays(member: Member?): ResultActionsDsl =
		mockMvc.get(MY_STAYS) { member?.let { with(user(MemberPrincipal.from(it))) } }

	private fun saveMember(email: String, name: String, phone: String): Member =
		memberRepository.save(Member(email, "password-hash", name, phone)).also { createdMemberIds += checkNotNull(it.id) }

	private fun roomTypes(hotelId: Long, vararg params: Pair<String, String>): ResultActionsDsl =
		mockMvc.get("${ApiPaths.APP}/hotels/$hotelId/room-types") { params.forEach { (name, value) -> param(name, value) } }

	private fun roomTypeParams(checkIn: LocalDate, checkOut: LocalDate, guestCount: Int): Array<Pair<String, String>> =
		arrayOf("checkInDate" to checkIn.toString(), "checkOutDate" to checkOut.toString(), "guestCount" to guestCount.toString())

	private fun body(
		checkIn: LocalDate,
		checkOut: LocalDate,
		roomTypeId: Long? = roomType(hotel).id,
		guestCount: Int = 2,
	): Map<String, Any?> =
		linkedMapOf(
			"hotelId" to hotel.id,
			"roomTypeId" to roomTypeId,
			"checkInDate" to checkIn.toString(),
			"checkOutDate" to checkOut.toString(),
			"guestCount" to guestCount,
		)

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun roomType(hotel: Hotel, name: String = STANDARD, capacity: Int = CAPACITY): RoomType =
		roomTypes.getOrPut(checkNotNull(hotel.id) to name) {
			roomTypeRepository.save(RoomType(hotel, name, capacity, ROOM_RATE, LocalTime.of(15, 0), LocalTime.of(11, 0)))
		}

	private fun saveRoom(hotel: Hotel, name: String, type: String = STANDARD): Room = roomRepository.save(Room(hotel, name, roomType(hotel, type), null, null))

	private fun saveStay(room: Room, checkIn: LocalDate, checkOut: LocalDate, guest: Guest = this.guest): Stay =
		stayRepository.save(Stay(room, guest, checkIn, checkOut, 2, ROOM_RATE))

	private fun cancelStay(stay: Stay) {
		jdbcTemplate.update(CANCEL_STAY, hotelAdmin.id, stay.id)
	}

	private fun stayRooms(): List<String?> = jdbcTemplate.queryForList(SELECT_STAY_ROOM_NAMES, String::class.java, hotel.id)

	private fun guests(hotel: Hotel): List<List<String>> =
		jdbcTemplate.query(SELECT_GUESTS, { rs, _ -> listOf(rs.getString(1), rs.getString(2), rs.getString(3)) }, hotel.id)

	private fun MvcResult.andExpectSuccess(status: HttpStatus): JsonNode {
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		val expectedMessage = if (request.method == "POST") message("success.stay.reserved") else null
		assertThat(response.status).isEqualTo(status.value())
		assertThat(body.properties().map { it.key }).containsExactly("success", "data", "message", "error")
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].stringValue(null)).isEqualTo(expectedMessage)
		assertThat(body["error"].isNull).isTrue()
		return body["data"]
	}

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().map { it["field"].stringValue() to it["message"].stringValue() }
		val expected = mapOf("success" to false, "data" to null, "message" to null, "error" to mapOf("code" to errorCode.code, "message" to message(errorCode.messageKey)))

		assertThat(response.status).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json(jsonMapper.writeValueAsString(expected)))
		assertThat(actualFieldErrors).containsExactlyInAnyOrder(*fieldErrors)
	}

	private fun stayJson(id: Long, checkIn: LocalDate, checkOut: LocalDate, guestCount: Int, guestName: String): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to id,
					"hotel" to linkedMapOf("id" to hotel.id, "name" to hotel.name),
					"roomType" to linkedMapOf("id" to roomType(hotel).id, "name" to STANDARD),
					"checkInDate" to checkIn.toString(),
					"checkOutDate" to checkOut.toString(),
					"guestCount" to guestCount,
					"roomRate" to ROOM_RATE,
					"nights" to ChronoUnit.DAYS.between(checkIn, checkOut),
					"baseAmount" to ROOM_RATE * ChronoUnit.DAYS.between(checkIn, checkOut),
					"discountAmount" to 0,
					"totalAmount" to ROOM_RATE * ChronoUnit.DAYS.between(checkIn, checkOut),
					"guest" to linkedMapOf("name" to guestName),
				),
			),
		)

	private fun roomTypesJson(vararg types: List<Any>): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				types.map { (name, roomCount, availableCount) ->
					val roomType = roomType(hotel, name as String)
					linkedMapOf(
						"id" to roomType.id,
						"name" to name,
						"capacity" to roomType.capacity,
						"roomRate" to ROOM_RATE,
						"checkInTime" to "15:00",
						"checkOutTime" to "11:00",
						"roomCount" to roomCount,
						"availableCount" to availableCount,
					)
				},
			),
		)

	private fun errorCodes(operation: JsonNode, status: HttpStatus): List<String> {
		val content = operation["responses"][status.value().toString()]["content"][JSON]
		val examples = content["example"]?.let { listOf(it) } ?: content["examples"].values().map { it["value"] }
		return examples.map { it["error"]["code"].stringValue() }
	}

	private fun required(schema: JsonNode): List<String> = schema.path("required").values().map { it.stringValue() }

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String, vararg arguments: Pair<String, String>): String =
		arguments.fold(messageSource.getMessage(key, null, Locale.KOREAN)) { text, (name, value) -> text.replace("{$name}", value) }

	companion object {
		private const val STAYS = ApiPaths.APP + "/stays"
		private const val MY_STAYS = ApiPaths.APP + "/me/stays"
		private const val APP_DOCS = "/v3/api-docs/app"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val PHONE = "010-1234-5678"
		private const val EMAIL = "guest@example.com"
		private const val CAPACITY = 4
		private const val ROOM_RATE = 120000
		private val ROOM_TYPE_FIELDS = listOf("id", "name", "capacity", "roomRate", "checkInTime", "checkOutTime", "roomCount", "availableCount")
		private const val STANDARD = "스탠다드"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val MIN = "validation.min"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val SELECT_ROOM_STATUS = "select status from room where id = ?"
		private const val SELECT_STAY_AMOUNTS = "select room_rate, nights, base_amount, discount_amount, total_amount from stay where id = ?"
		private const val SELECT_STAY_ROOM_NAMES = "select r.name from stay s join room r on r.id = s.room_id where r.hotel_id = ? order by s.id"
		private const val SELECT_GUESTS = "select name, phone, email from guest where hotel_id = ? order by id"
		private const val SELECT_GUEST_ID_OF_STAY = "select guest_id from stay where id = ?"
		private const val SELECT_GUEST_MEMBER_OF_STAY = "select g.member_id from stay s join guest g on g.id = s.guest_id where s.id = ?"
		private const val SELECT_GUEST_MEMBER = "select member_id from guest where id in (?, ?) order by id"
		private const val UPDATE_GUEST_MEMBER = "update guest set member_id = ? where id = ?"
		private const val SELECT_GUEST_CREATED_AT = "select g.created_at from stay s join guest g on g.id = s.guest_id where s.id = ?"
		private const val UPDATE_ROOM_STATUS = "update room set status = ? where id = ?"
		private const val CANCEL_STAY = "update stay set canceled_at = now(), canceled_by_id = ?, canceled_by_name = '계정' where id = ?"
		private val DELETE_BY_HOTEL = listOf(
			"delete from stay where room_id in (select id from room where hotel_id = ?)",
			"delete from guest where hotel_id = ?",
			"delete from room where hotel_id = ?",
			"delete from room_type where hotel_id = ?",
			"delete from hotel_admin where hotel_id = ?",
		)
	}
}
