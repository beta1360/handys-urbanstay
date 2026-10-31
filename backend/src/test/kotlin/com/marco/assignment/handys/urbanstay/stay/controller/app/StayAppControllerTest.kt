package com.marco.assignment.handys.urbanstay.stay.controller.app

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.NOW
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.TODAY
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
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
	private lateinit var guestRepository: GuestRepository

	@Autowired
	private lateinit var stayRepository: StayRepository

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

	@BeforeEach
	fun createRoomsAndGuests() {
		hotel = saveHotel("어반스테이 $suffix")
		otherHotel = saveHotel("다른 호텔 $suffix")
		room = saveRoom(hotel, "101")
		otherRoom = saveRoom(hotel, "102")
		guest = guestRepository.save(Guest(hotel, "홍길동", PHONE, EMAIL))
		guestRepository.save(Guest(otherHotel, "다른 호텔 이용객", PHONE, EMAIL))
		hotelAdmin = hotelAdminRepository.save(HotelAdmin(hotel, "master-$suffix@test.local", "password-hash", "계정", HotelAdminRole.MASTER))
	}

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `로그인과 CSRF 토큰 없이 새 이용객으로 예약하면 앞뒤 공백을 지운 이용객과 이용을 함께 저장하고 객실 상태는 그대로 두며 201로 예약 내용을 응답한다`() {
		jdbcTemplate.update(UPDATE_ROOM_STATUS, RoomStatus.MAINTENANCE.name, room.id)
		val newGuest = mapOf("name" to " 김철수 ", "phone" to " 010-9999-8888 ", "email" to " Kim@Example.com ")

		val result = reserve(body(TODAY, TODAY.plusDays(2), guestCount = CAPACITY, guest = newGuest)).andReturn()
		val data = result.andExpectSuccess(HttpStatus.CREATED)

		val id = data["id"].longValue()
		assertThat(data).isEqualTo(stayJson(id, room, TODAY, TODAY.plusDays(2), CAPACITY, "김철수"))
		assertThat(result.request.getSession(false)).isNull()
		assertThat(result.response.cookies).isEmpty()
		assertThat(guests(hotel)).containsExactly(listOf("홍길동", PHONE, EMAIL), listOf("김철수", "010-9999-8888", "Kim@Example.com"))
		assertThat(jdbcTemplate.queryForObject(SELECT_GUEST_NAME_OF_STAY, String::class.java, id)).isEqualTo("김철수")
		assertThat(jdbcTemplate.queryForObject(SELECT_GUEST_CREATED_AT, Timestamp::class.java, id)?.toInstant()).isEqualTo(NOW)
		assertThat(jdbcTemplate.queryForObject(SELECT_ROOM_STATUS, String::class.java, room.id)).isEqualTo(RoomStatus.MAINTENANCE.name)
	}

	@Test
	fun `같은 호텔에 숫자가 같은 전화번호의 이용객이 있으면 그 이용객으로 예약하고 이름과 이메일은 바꾸지 않는다`() {
		val sameGuest = mapOf("name" to "다른 이름", "phone" to "01012345678", "email" to "other@example.com")

		val data = reserve(body(TODAY, TODAY.plusDays(1), guest = sameGuest)).andReturn().andExpectSuccess(HttpStatus.CREATED)

		assertThat(data["guest"]["name"].stringValue()).isEqualTo("홍길동")
		assertThat(guests(hotel)).containsExactly(listOf("홍길동", PHONE, EMAIL))
		assertThat(guests(otherHotel)).containsExactly(listOf("다른 호텔 이용객", PHONE, EMAIL))
		assertThat(jdbcTemplate.queryForObject(SELECT_GUEST_ID_OF_STAY, Long::class.java, data["id"].longValue())).isEqualTo(guest.id)
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

		reserve(body(TODAY.plusDays(checkIn), TODAY.plusDays(checkOut), guest = NEW_GUEST)).andExpectError(CommonErrorCode.INVALID_INPUT, *expected.toTypedArray())

		assertThat(stayIds(room)).isEmpty()
		assertThat(guests(hotel)).hasSize(1)
	}

	@Test
	fun `인원이 1보다 적거나 객실 최대 인원보다 많으면 guestCount로, 이용객 항목이 틀리면 guest 아래 경로로 400 응답하고 저장하지 않는다`() {
		reserve(body(TODAY, TODAY.plusDays(1), guestCount = 0)).andExpectError(CommonErrorCode.INVALID_INPUT, "guestCount" to message(MIN, "value" to "1"))
		reserve(body(TODAY.minusDays(1), TODAY.plusDays(1), guestCount = CAPACITY + 1)).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"checkInDate" to message("validation.today-or-later"),
			"guestCount" to message(MAX, "value" to CAPACITY.toString()),
		)
		reserve(body(TODAY, TODAY.plusDays(1), guest = mapOf("name" to " ", "phone" to "1234567", "email" to "guest"))).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"guest.name" to message("validation.required"),
			"guest.phone" to message("validation.phone"),
			"guest.email" to message("validation.email"),
		)
		reserve(body(TODAY, TODAY.plusDays(1)) - "guest").andExpectError(CommonErrorCode.INVALID_INPUT, "guest" to message("validation.required"))

		assertThat(stayIds(room)).isEmpty()
		assertThat(guests(hotel)).hasSize(1)
	}

	@Test
	fun `같은 객실에 기간이 하루라도 겹치면 409 STAY_PERIOD_OVERLAPPED로 응답하고, 체크아웃 날 체크인, 다른 객실, 취소한 이용과 같은 기간은 예약한다`() {
		val existing = saveStay(room, TODAY.plusDays(5), TODAY.plusDays(7))
		cancelStay(saveStay(room, TODAY.plusDays(10), TODAY.plusDays(12)))

		listOf(4L to 6L, 6L to 8L, 4L to 8L).forEach { (checkIn, checkOut) ->
			reserve(body(TODAY.plusDays(checkIn), TODAY.plusDays(checkOut), guest = NEW_GUEST)).andExpectError(StayErrorCode.STAY_PERIOD_OVERLAPPED)
		}
		assertThat(guests(hotel)).hasSize(1)

		reserve(body(TODAY.plusDays(7), TODAY.plusDays(9))).andReturn().andExpectSuccess(HttpStatus.CREATED)
		reserve(body(TODAY.plusDays(5), TODAY.plusDays(7), room = otherRoom)).andReturn().andExpectSuccess(HttpStatus.CREATED)
		reserve(body(TODAY.plusDays(10), TODAY.plusDays(12))).andReturn().andExpectSuccess(HttpStatus.CREATED)
		assertThat(stayIds(room)).hasSize(4).contains(existing.id)
	}

	@Test
	fun `없는 객실은 예약과 예약된 기간 조회 모두 404 ROOM_NOT_FOUND로 응답한다`() {
		reserve(body(TODAY, TODAY.plusDays(1)) + ("roomId" to MISSING_ID)).andExpectError(RoomErrorCode.ROOM_NOT_FOUND)
		reservedPeriods(MISSING_ID).andExpectError(RoomErrorCode.ROOM_NOT_FOUND)

		assertThat(guests(hotel)).hasSize(1)
	}

	@Test
	fun `예약된 기간은 취소하지 않았고 끝나지 않은 그 객실 이용의 날짜만 체크인 이른 순으로 페이지로 보여준다`() {
		saveStay(room, TODAY.minusDays(2), TODAY)
		saveStay(room, TODAY.plusDays(5), TODAY.plusDays(7))
		saveStay(room, TODAY, TODAY.plusDays(2))
		saveStay(room, TODAY.plusDays(2), TODAY.plusDays(4))
		cancelStay(saveStay(room, TODAY.plusDays(8), TODAY.plusDays(9)))
		saveStay(otherRoom, TODAY.plusDays(1), TODAY.plusDays(2))

		val data = reservedPeriods(checkNotNull(room.id)).andReturn().andExpectSuccess(HttpStatus.OK)

		assertThat(data["items"]).isEqualTo(periodsJson(TODAY to TODAY.plusDays(2), TODAY.plusDays(2) to TODAY.plusDays(4), TODAY.plusDays(5) to TODAY.plusDays(7)))
		assertThat(pageInfo(data)).containsExactly(0, 10, 3, 1)
		val second = reservedPeriods(room.id!!, "page" to "1", "size" to "2").andReturn().andExpectSuccess(HttpStatus.OK)
		assertThat(second["items"]).isEqualTo(periodsJson(TODAY.plusDays(5) to TODAY.plusDays(7)))
	}

	@Test
	fun `예약 API 문서는 게스트 앱 그룹의 stay 태그에 객실·이용 에러 예시와 요청 규칙을 보여준다`() {
		val docs = json(mockMvc.get(APP_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val create = docs["paths"][STAYS]["post"]
		val periods = docs["paths"]["${ApiPaths.APP}/rooms/{roomId}/reserved-periods"]["get"]
		val schemas = docs["components"]["schemas"]
		val guestProperties = schemas["StayGuestCreateAppRequest"]["properties"]

		assertThat(listOf(create, periods).map { it["operationId"].stringValue() }).containsExactly("createStay", "getRoomReservedPeriods")
		assertThat(listOf(create, periods).map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("stay"))
		assertThat(create["responses"].propertyNames()).containsExactlyInAnyOrder("201", "400", "404", "409", "500")
		assertThat(errorCodes(create, HttpStatus.NOT_FOUND)).containsExactly(RoomErrorCode.ROOM_NOT_FOUND.code)
		assertThat(errorCodes(create, HttpStatus.CONFLICT)).containsExactly(StayErrorCode.STAY_PERIOD_OVERLAPPED.code)
		assertThat(periods["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "404", "500")
		assertThat(errorCodes(periods, HttpStatus.NOT_FOUND)).containsExactly(RoomErrorCode.ROOM_NOT_FOUND.code)
		assertThat(required(schemas["StayCreateAppRequest"])).containsExactlyInAnyOrder("roomId", "checkInDate", "checkOutDate", "guestCount", "guest")
		assertThat(required(schemas["StayGuestCreateAppRequest"])).containsExactlyInAnyOrder("name", "phone", "email")
		assertThat(listOf("name", "phone", "email").map { field -> listOf("maxLength", "pattern").map { guestProperties[field][it]?.asString() } })
			.containsExactly(
				listOf(Guest.NAME_MAX_LENGTH.toString(), null),
				listOf(Guest.PHONE_MAX_LENGTH.toString(), Hotel.PHONE_PATTERN),
				listOf(Guest.EMAIL_MAX_LENGTH.toString(), LoginId.PATTERN),
			)
		assertThat(schemas["StayAppResponse"]["properties"].propertyNames())
			.containsExactly("id", "hotel", "room", "checkInDate", "checkOutDate", "guestCount", "guest")
		assertThat(schemas["StayReservedPeriodAppResponse"]["properties"].propertyNames()).containsExactly("checkInDate", "checkOutDate")
	}

	private fun reserve(body: Map<String, Any?>): ResultActionsDsl =
		mockMvc.post(STAYS) {
			contentType = MediaType.APPLICATION_JSON
			content = jsonMapper.writeValueAsString(body)
		}

	private fun reservedPeriods(roomId: Long, vararg params: Pair<String, String>): ResultActionsDsl =
		mockMvc.get("${ApiPaths.APP}/rooms/$roomId/reserved-periods") { params.forEach { (name, value) -> param(name, value) } }

	private fun body(
		checkIn: LocalDate,
		checkOut: LocalDate,
		room: Room = this.room,
		guestCount: Int = 2,
		guest: Map<String, Any?> = mapOf("name" to "홍길동", "phone" to PHONE, "email" to EMAIL),
	): Map<String, Any?> =
		linkedMapOf(
			"roomId" to room.id,
			"checkInDate" to checkIn.toString(),
			"checkOutDate" to checkOut.toString(),
			"guestCount" to guestCount,
			"guest" to guest,
		)

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveRoom(hotel: Hotel, name: String): Room =
		roomRepository.save(Room(hotel, name, "스탠다드", CAPACITY, null, null, LocalTime.of(15, 0), LocalTime.of(11, 0)))

	private fun saveStay(room: Room, checkIn: LocalDate, checkOut: LocalDate): Stay = stayRepository.save(Stay(room, guest, checkIn, checkOut, 2))

	private fun cancelStay(stay: Stay) {
		jdbcTemplate.update(CANCEL_STAY, hotelAdmin.id, stay.id)
	}

	private fun stayIds(room: Room): List<Long> = jdbcTemplate.queryForList(SELECT_STAY_IDS, Long::class.javaObjectType, room.id).filterNotNull()

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

	private fun stayJson(id: Long, room: Room, checkIn: LocalDate, checkOut: LocalDate, guestCount: Int, guestName: String): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to id,
					"hotel" to linkedMapOf("id" to hotel.id, "name" to hotel.name),
					"room" to linkedMapOf("id" to room.id, "name" to room.name),
					"checkInDate" to checkIn.toString(),
					"checkOutDate" to checkOut.toString(),
					"guestCount" to guestCount,
					"guest" to linkedMapOf("name" to guestName),
				),
			),
		)

	private fun periodsJson(vararg periods: Pair<LocalDate, LocalDate>): JsonNode =
		json(jsonMapper.writeValueAsString(periods.map { (checkIn, checkOut) -> linkedMapOf("checkInDate" to checkIn.toString(), "checkOutDate" to checkOut.toString()) }))

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

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
		private const val APP_DOCS = "/v3/api-docs/app"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val PHONE = "010-1234-5678"
		private const val EMAIL = "guest@example.com"
		private const val CAPACITY = 4
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val MIN = "validation.min"
		private const val MAX = "validation.max"
		private const val MISSING_ID = Long.MAX_VALUE
		private val NEW_GUEST = mapOf("name" to "새 이용객", "phone" to "010-7777-6666", "email" to "new@example.com")
		private const val SELECT_ROOM_STATUS = "select status from room where id = ?"
		private const val SELECT_STAY_IDS = "select id from stay where room_id = ? order by id"
		private const val SELECT_GUESTS = "select name, phone, email from guest where hotel_id = ? order by id"
		private const val SELECT_GUEST_ID_OF_STAY = "select guest_id from stay where id = ?"
		private const val SELECT_GUEST_NAME_OF_STAY = "select g.name from stay s join guest g on g.id = s.guest_id where s.id = ?"
		private const val SELECT_GUEST_CREATED_AT = "select g.created_at from stay s join guest g on g.id = s.guest_id where s.id = ?"
		private const val UPDATE_ROOM_STATUS = "update room set status = ? where id = ?"
		private const val CANCEL_STAY = "update stay set canceled_at = now(), canceled_by_id = ?, canceled_by_name = '계정' where id = ?"
		private val DELETE_BY_HOTEL = listOf(
			"delete from stay where room_id in (select id from room where hotel_id = ?)",
			"delete from guest where hotel_id = ?",
			"delete from room where hotel_id = ?",
			"delete from hotel_admin where hotel_id = ?",
		)
	}
}
