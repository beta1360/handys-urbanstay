package com.marco.assignment.handys.urbanstay.stay.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.NOW
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.TODAY
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.exception.StayErrorCode
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
import org.springframework.test.web.servlet.MockMvc
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
class StayHotelAdminControllerTest {

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

	private val roomTypes = mutableMapOf<Long, RoomType>()

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

	private val xsrf: Cookie by lazy { checkNotNull(mockMvc.get(HOTEL_ADMIN_ME).andReturn().response.getCookie(XSRF_COOKIE)) }

	private lateinit var room: Room

	private lateinit var otherRoom: Room

	private lateinit var guest: Guest

	private lateinit var otherGuest: Guest

	private lateinit var otherHotelRoom: Room

	private lateinit var otherHotelGuest: Guest

	private lateinit var principals: Map<HotelAdminRole, UserDetails>

	private val masterPrincipal: UserDetails get() = principals.getValue(HotelAdminRole.MASTER)

	@BeforeEach
	fun createRoomsAndGuests() {
		val hotel = saveHotel("어반스테이 $suffix")
		val otherHotel = saveHotel("다른 호텔 $suffix")
		room = saveRoom(hotel, "101")
		otherRoom = saveRoom(hotel, "102")
		guest = saveGuest(hotel, "홍길동", "010-1234-5678")
		otherGuest = saveGuest(hotel, "김철수", "010-8765-4321")
		otherHotelRoom = saveRoom(otherHotel, "101")
		otherHotelGuest = saveGuest(otherHotel, "홍길동", "010-1234-5678")
		principals = HotelAdminRole.entries.associateWith { role ->
			HotelAdminPrincipal.from(saveHotelAdmin(hotel, "${role.name.lowercase()}-$suffix@test.local", role))
		}
	}

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `이용 등록 API는 없어 로그인과 CSRF 토큰이 있어도 404 NOT_FOUND로 응답하고 등록하지 않는다`() {
		val body = linkedMapOf(
			"roomId" to room.id,
			"guestId" to guest.id,
			"checkInDate" to TODAY.toString(),
			"checkOutDate" to TODAY.plusDays(1).toString(),
			"guestCount" to 2,
		)

		mockMvc.post(STAYS) {
			with(user(masterPrincipal))
			withCsrf()
			jsonBody(body)
		}.andExpectError(CommonErrorCode.NOT_FOUND)

		assertThat(stayIds(room)).isEmpty()
	}

	@Test
	fun `없거나 다른 호텔의 이용은 404 STAY_NOT_FOUND로 응답한다`() {
		val otherHotelStay = saveStay(otherHotelRoom, otherHotelGuest, TODAY, TODAY.plusDays(1))

		listOf(MISSING_ID, checkNotNull(otherHotelStay.id)).forEach { stayId ->
			HotelAdminRole.entries.forEach { getStay(stayId, principals.getValue(it)).andExpectError(StayErrorCode.STAY_NOT_FOUND) }
		}
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 목록을 자기 호텔 이용만 체크인 날짜 내림차순, 같으면 id 내림차순으로 조회하고 객실과 이용객으로 거른다`(role: HotelAdminRole) {
		val early = saveStay(room, guest, TODAY.minusDays(10), TODAY.minusDays(8))
		val late = saveStay(room, otherGuest, TODAY.plusDays(3), TODAY.plusDays(4))
		val sameDayFirst = saveStay(otherRoom, guest, TODAY, TODAY.plusDays(2))
		val sameDaySecond = saveStay(room, guest, TODAY, TODAY.plusDays(1))
		saveStay(otherHotelRoom, otherHotelGuest, TODAY, TODAY.plusDays(1))
		val principal = principals.getValue(role)

		val all = getStays(principal = principal)

		assertThat(itemIds(all)).containsExactly(late.id, sameDaySecond.id, sameDayFirst.id, early.id)
		assertThat(pageInfo(all)).containsExactly(0, 10, 4, 1)
		assertThat(all["items"][0]).isEqualTo(stayJson(checkNotNull(late.id), room, otherGuest, TODAY.plusDays(3), TODAY.plusDays(4), 2))
		assertThat(itemIds(getStays("roomId" to room.id, principal = principal))).containsExactly(late.id, sameDaySecond.id, early.id)
		assertThat(itemIds(getStays("guestId" to guest.id, principal = principal))).containsExactly(sameDaySecond.id, sameDayFirst.id, early.id)
		assertThat(itemIds(getStays("roomId" to room.id, "guestId" to guest.id, principal = principal))).containsExactly(sameDaySecond.id, early.id)
	}

	@Test
	fun `없거나 다른 호텔의 객실과 이용객으로 거르면 빈 목록이다`() {
		saveStay(room, guest, TODAY, TODAY.plusDays(1))
		saveStay(otherHotelRoom, otherHotelGuest, TODAY, TODAY.plusDays(1))

		listOf("roomId" to otherHotelRoom.id, "roomId" to MISSING_ID, "guestId" to otherHotelGuest.id, "guestId" to MISSING_ID).forEach {
			assertThat(pageInfo(getStays(it))).containsExactly(0, 10, 0, 0)
		}
	}

	@ParameterizedTest(name = "{0} -> {1}")
	@CsvSource(
		delimiter = '|',
		value = [
			"keyword=홍길동 | s3,s1",
			"keyword= kIM | s4",
			"keyword=01087654321 | s2",
			"keyword=4-56 | s3,s1",
			"checkInFrom=0 | s4,s3,s2",
			"checkInTo=0 | s2,s1",
			"checkInFrom=0&checkInTo=0 | s2",
			"checkInFrom=3&checkInTo=5 | s4,s3",
			"keyword=홍길동&checkInFrom=0 | s3",
			"keyword=홍길동&roomId=room | s1",
			"keyword=홍길동&canceled=false | s3",
			"keyword=홍길동&canceled=true&checkInTo=0 | s1",
			"keyword=없는 이용객 | ''",
		],
	)
	fun `검색어는 이용객 이름을 대소문자 구분 없이, 전화번호를 양쪽 하이픈을 빼고 찾고 체크인 기간은 양 끝을 포함해 다른 필터와 함께 거른다`(query: String, expected: String) {
		val englishGuest = saveGuest(room.hotel, "Kim Lee", "02-555-0000")
		val stays = mapOf(
			"s1" to saveStay(room, guest, TODAY.minusDays(10), TODAY.minusDays(8)),
			"s2" to saveStay(room, otherGuest, TODAY, TODAY.plusDays(1)),
			"s3" to saveStay(otherRoom, guest, TODAY.plusDays(3), TODAY.plusDays(4)),
			"s4" to saveStay(otherRoom, englishGuest, TODAY.plusDays(5), TODAY.plusDays(6)),
		)
		saveStay(otherHotelRoom, otherHotelGuest, TODAY, TODAY.plusDays(1))
		jdbcTemplate.update(CANCEL_STAY, (masterPrincipal as HotelAdminPrincipal).id, stays.getValue("s1").id)
		val params = query.split("&").map { it.substringBefore("=") to filterValue(it.substringBefore("="), it.substringAfter("=")) }

		val data = getStays(*params.toTypedArray())

		assertThat(itemIds(data)).containsExactlyElementsOf(expected.split(",").filter { it.isNotEmpty() }.map { stays.getValue(it).id })
	}

	@Test
	fun `체크인 기간의 시작이 끝보다 늦으면 checkInTo로, 날짜 형식이 틀리거나 검색어가 100자를 넘으면 그 파라미터로 400 응답한다`() {
		val max = StayHotelAdminController.KEYWORD_MAX_LENGTH

		requestStays("checkInFrom" to TODAY.plusDays(1), "checkInTo" to TODAY)
			.andExpectError(CommonErrorCode.INVALID_INPUT, "checkInTo" to message("validation.from-or-later"))
		requestStays("checkInFrom" to "2026/11/01").andExpectError(CommonErrorCode.INVALID_INPUT, "checkInFrom" to message("validation.type"))
		requestStays("keyword" to "가".repeat(max + 1))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "keyword" to message("validation.max-length", "max" to max.toString()))
		assertThat(pageInfo(getStays("keyword" to " ${"가".repeat(max)} "))).containsExactly(0, 10, 0, 0)
	}

	@Test
	fun `page와 size로 원하는 페이지를 조회한다`() {
		val ids = (1L..7L).map { checkNotNull(saveStay(room, guest, TODAY.plusDays(it * 2), TODAY.plusDays(it * 2 + 1)).id) }.reversed()

		val data = getStays("page" to 1, "size" to 3)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.subList(3, 6))
		assertThat(pageInfo(data)).containsExactly(1, 3, 7, 3)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 끝나지 않은 이용을 취소해 취소 정보로 응답하고, 예약됨 객실은 공실로 바꿔 취소한 계정으로 이력을 남긴다`(role: HotelAdminRole) {
		val principal = principals.getValue(role) as HotelAdminPrincipal
		val stay = saveStay(room, guest, TODAY.minusDays(1), TODAY.plusDays(1))
		jdbcTemplate.update(UPDATE_ROOM_STATUS, RoomStatus.RESERVED.name, room.id)

		val data = cancel(checkNotNull(stay.id), mapOf("reason" to "  고객 요청으로 일정 변경  "), principal).andExpectSuccess(HttpStatus.OK)
		jdbcTemplate.update(UPDATE_HOTEL_ADMIN_NAME, "바뀐 이름", principal.id)

		val expected = stayJson(stay.id!!, room, guest, TODAY.minusDays(1), TODAY.plusDays(1), 2, cancellation(principal.id, "계정", "고객 요청으로 일정 변경"))
		assertThat(data).isEqualTo(expected)
		assertThat(getStay(stay.id!!).andExpectSuccess(HttpStatus.OK)).isEqualTo(expected)
		assertThat(jdbcTemplate.queryForObject(SELECT_ROOM_STATUS, String::class.java, room.id)).isEqualTo(RoomStatus.VACANT.name)
		assertThat(histories(room)).containsExactly(listOf(RoomStatus.RESERVED.name, RoomStatus.VACANT.name, principal.id, "계정"))
	}

	@ParameterizedTest
	@EnumSource(value = RoomStatus::class, names = ["OCCUPIED", "MAINTENANCE", "VACANT"])
	fun `객실이 이용중, 정비중, 공실이면 취소해도 객실 상태를 바꾸지 않고 이력을 남기지 않는다`(status: RoomStatus) {
		val stay = saveStay(room, guest, TODAY, TODAY.plusDays(1))
		jdbcTemplate.update(UPDATE_ROOM_STATUS, status.name, room.id)

		cancel(checkNotNull(stay.id)).andExpectSuccess(HttpStatus.OK)

		assertThat(jdbcTemplate.queryForObject(SELECT_ROOM_STATUS, String::class.java, room.id)).isEqualTo(status.name)
		assertThat(histories(room)).isEmpty()
	}

	@Test
	fun `이미 취소한 이용은 끝났어도 409 STAY_ALREADY_CANCELED로 응답하고 처음 취소 기록을 바꾸지 않는다`() {
		val stay = saveStay(room, guest, TODAY, TODAY.plusDays(1))
		val first = cancel(checkNotNull(stay.id), mapOf("reason" to "처음 사유")).andExpectSuccess(HttpStatus.OK)
		val ended = saveStay(room, guest, TODAY.minusDays(3), TODAY.minusDays(1))
		jdbcTemplate.update(CANCEL_STAY, (masterPrincipal as HotelAdminPrincipal).id, ended.id)

		cancel(stay.id!!, mapOf("reason" to "다시 보낸 사유")).andExpectError(StayErrorCode.STAY_ALREADY_CANCELED)
		cancel(checkNotNull(ended.id)).andExpectError(StayErrorCode.STAY_ALREADY_CANCELED)

		assertThat(getStay(stay.id!!).andExpectSuccess(HttpStatus.OK)).isEqualTo(first)
	}

	@ParameterizedTest
	@CsvSource("-1, 0", "-3, -1")
	fun `체크아웃 날짜가 한국 시간 오늘이거나 지난 이용은 409 STAY_ALREADY_ENDED로 응답하고 취소하지 않는다`(checkIn: Long, checkOut: Long) {
		val stay = saveStay(room, guest, TODAY.plusDays(checkIn), TODAY.plusDays(checkOut))

		cancel(checkNotNull(stay.id)).andExpectError(StayErrorCode.STAY_ALREADY_ENDED)

		assertThat(getStay(stay.id!!).andExpectSuccess(HttpStatus.OK)["cancellation"].isNull).isTrue()
	}

	@Test
	fun `없거나 다른 호텔의 이용 취소는 404 STAY_NOT_FOUND로 응답하고 취소하지 않는다`() {
		val otherHotelStay = saveStay(otherHotelRoom, otherHotelGuest, TODAY, TODAY.plusDays(1))

		listOf(MISSING_ID, checkNotNull(otherHotelStay.id)).forEach { cancel(it).andExpectError(StayErrorCode.STAY_NOT_FOUND) }

		assertThat(jdbcTemplate.queryForObject(SELECT_CANCELED_AT, Timestamp::class.java, otherHotelStay.id)).isNull()
	}

	@Test
	fun `사유는 앞뒤 공백을 지워 200자까지 받고, 없거나 null이거나 비면 사유 없이 취소하며, 200자를 넘으면 400 응답한다`() {
		val stays = (1L..5L).map { checkNotNull(saveStay(room, guest, TODAY.plusDays(it * 2), TODAY.plusDays(it * 2 + 1)).id) }
		val maxReason = "가".repeat(Stay.CANCEL_REASON_MAX_LENGTH)

		cancel(stays[0], mapOf("reason" to "가".repeat(Stay.CANCEL_REASON_MAX_LENGTH + 1)))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "reason" to message("validation.max-length", "max" to "200"))
		assertThat(cancel(stays[0], mapOf("reason" to " $maxReason ")).andExpectSuccess(HttpStatus.OK)["cancellation"]["reason"].stringValue()).isEqualTo(maxReason)
		listOf(emptyMap(), mapOf("reason" to null), mapOf("reason" to ""), mapOf("reason" to "   ")).zip(stays.drop(1)).forEach { (body, stayId) ->
			assertThat(cancel(stayId, body).andExpectSuccess(HttpStatus.OK)["cancellation"]["reason"].isNull).isTrue()
		}
	}

	@Test
	fun `목록은 취소한 이용도 취소 정보와 함께 보여주고 canceled로 취소 여부를 거르며 다른 필터와 함께 쓴다`() {
		val active = saveStay(room, guest, TODAY.plusDays(1), TODAY.plusDays(2))
		val canceled = saveStay(room, guest, TODAY, TODAY.plusDays(1))
		val otherRoomCanceled = saveStay(otherRoom, guest, TODAY.plusDays(3), TODAY.plusDays(4))
		listOf(canceled, otherRoomCanceled).forEach { cancel(checkNotNull(it.id)).andExpectSuccess(HttpStatus.OK) }

		val all = getStays()

		assertThat(itemIds(all)).containsExactly(otherRoomCanceled.id, active.id, canceled.id)
		assertThat(all["items"].values().map { it["cancellation"].isNull }).containsExactly(false, true, false)
		assertThat(itemIds(getStays("canceled" to true))).containsExactly(otherRoomCanceled.id, canceled.id)
		assertThat(itemIds(getStays("canceled" to false))).containsExactly(active.id)
		assertThat(itemIds(getStays("roomId" to room.id, "guestId" to guest.id, "canceled" to true))).containsExactly(canceled.id)
		mockMvc.get(STAYS) { with(user(masterPrincipal)); param("canceled", "TRUE") }
			.andExpectError(CommonErrorCode.INVALID_INPUT, "canceled" to message("validation.type"))
	}

	@Test
	fun `로그인하지 않으면 401, 전체 어드민 역할이면 403, CSRF 토큰이 없으면 403 INVALID_CSRF_TOKEN으로 응답하고 취소하지 않는다`() {
		val stay = saveStay(room, guest, TODAY, TODAY.plusDays(1))
		val appAdmin = User.withUsername("tester").password(PASSWORD_HASH).roles(Role.APP_ADMIN.name).build()
		val cancelPath = "$STAYS/${stay.id}/cancel"

		mockMvc.get(STAYS).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get("$STAYS/${stay.id}").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.post(cancelPath) { withCsrf(); jsonBody(emptyMap()) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get(STAYS) { with(user(appAdmin)) }.andExpectError(CommonErrorCode.FORBIDDEN)
		getStay(checkNotNull(stay.id), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		cancel(stay.id!!, principal = appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		mockMvc.post(cancelPath) { with(user(masterPrincipal)); jsonBody(emptyMap()) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		assertThat(jdbcTemplate.queryForObject(SELECT_CANCELED_AT, Timestamp::class.java, stay.id)).isNull()
	}

	@Test
	fun `이용 API 문서는 stay 태그에 operation마다 낼 수 있는 이용 에러를 예시로 보여준다`() {
		val docs = apiDocs()
		val stays = docs["paths"][STAYS]
		val stay = docs["paths"]["$STAYS/{stayId}"]
		val cancel = docs["paths"]["$STAYS/{stayId}/cancel"]["post"]
		val operations = listOf(stays["get"], stay["get"], cancel)
		val schemas = docs["components"]["schemas"]

		assertThat(stays.has("post")).isFalse()
		assertThat(schemas.has("StayCreateHotelAdminRequest")).isFalse()
		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("getStays", "getStay", "cancelStay")
		assertThat(operations.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("stay"))
		assertThat(stays["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(stays["get"]["parameters"].values().map { it["name"].stringValue() })
			.containsExactly("roomId", "guestId", "canceled", "keyword", "checkInFrom", "checkInTo", "page", "size")
		assertThat(stays["get"]["parameters"].values().filter { it["name"].stringValue().startsWith("checkIn") }.map { it["schema"]["format"].stringValue() })
			.containsOnly("date")
		assertThat(errorCodes(stay["get"], HttpStatus.NOT_FOUND)).containsExactly(StayErrorCode.STAY_NOT_FOUND.code)
		assertThat(cancel["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "409", "500")
		assertThat(errorCodes(cancel, HttpStatus.NOT_FOUND)).containsExactly(StayErrorCode.STAY_NOT_FOUND.code)
		assertThat(errorCodes(cancel, HttpStatus.CONFLICT))
			.containsExactlyInAnyOrder(StayErrorCode.STAY_ALREADY_CANCELED.code, StayErrorCode.STAY_ALREADY_ENDED.code)
		assertThat(schemas["StayCancelHotelAdminRequest"]["properties"]["reason"]["maxLength"].intValue()).isEqualTo(Stay.CANCEL_REASON_MAX_LENGTH)
		assertThat(schemas["StayCancelHotelAdminRequest"].has("required")).isFalse()
		assertThat(schemas["StayHotelAdminResponse"]["properties"]["cancellation"]["oneOf"].values().map { it["type"]?.stringValue() ?: it[REF].stringValue() })
			.containsExactlyInAnyOrder("null", "#/components/schemas/StayCancellationHotelAdminResponse")
	}

	private fun getStays(vararg params: Pair<String, Any?>, principal: UserDetails = masterPrincipal): JsonNode =
		requestStays(*params, principal = principal).andExpectSuccess(HttpStatus.OK)

	private fun requestStays(vararg params: Pair<String, Any?>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get(STAYS) {
			with(user(principal))
			params.forEach { (name, value) -> param(name, value.toString()) }
		}

	private fun filterValue(name: String, value: String): Any? =
		when (name) {
			"checkInFrom", "checkInTo" -> TODAY.plusDays(value.toLong())
			"roomId" -> room.id
			else -> value
		}

	private fun getStay(id: Long, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get("$STAYS/$id") { with(user(principal)) }

	private fun cancel(id: Long, body: Map<String, Any?> = emptyMap(), principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.post("$STAYS/$id/cancel") {
			with(user(principal))
			withCsrf()
			jsonBody(body)
		}

	private fun MockHttpServletRequestDsl.withCsrf() {
		cookie(xsrf)
		header(XSRF_HEADER, xsrf.value)
	}

	private fun MockHttpServletRequestDsl.jsonBody(body: Map<String, Any?>) {
		contentType = MediaType.APPLICATION_JSON
		content = jsonMapper.writeValueAsString(body)
	}

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, PASSWORD_HASH, "계정", role))

	private fun saveRoom(hotel: Hotel, name: String): Room =
		roomRepository.save(Room(hotel, name, roomType(hotel), null, null))

	private fun roomType(hotel: Hotel): RoomType =
		roomTypes.getOrPut(checkNotNull(hotel.id)) {
			roomTypeRepository.save(RoomType(hotel, "스탠다드", CAPACITY, ROOM_RATE, LocalTime.of(15, 0), LocalTime.of(11, 0)))
		}

	private fun saveGuest(hotel: Hotel, name: String, phone: String): Guest = guestRepository.save(Guest(hotel, name, phone, "guest@example.com"))

	private fun saveStay(room: Room, guest: Guest, checkIn: LocalDate, checkOut: LocalDate): Stay = stayRepository.save(Stay(room, guest, checkIn, checkOut, 2, ROOM_RATE))

	private fun stayIds(room: Room): List<Long> = jdbcTemplate.queryForList(SELECT_STAY_IDS, Long::class.javaObjectType, room.id).filterNotNull()

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus): JsonNode {
		val result = andReturn()
		val body = json(result.response.getContentAsString(StandardCharsets.UTF_8))
		val expectedMessage = if (result.request.method == "POST") message("success.stay.canceled") else null
		assertThat(result.response.status).isEqualTo(status.value())
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

	private fun stayJson(
		id: Long,
		room: Room,
		guest: Guest,
		checkIn: LocalDate,
		checkOut: LocalDate,
		guestCount: Int,
		cancellation: Map<String, Any?>? = null,
	): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to id,
					"room" to linkedMapOf("id" to room.id, "name" to room.name),
					"guest" to linkedMapOf("id" to guest.id, "name" to guest.name, "phone" to guest.phone),
					"checkInDate" to checkIn.toString(),
					"checkOutDate" to checkOut.toString(),
					"guestCount" to guestCount,
					"roomRate" to ROOM_RATE,
					"nights" to ChronoUnit.DAYS.between(checkIn, checkOut),
					"baseAmount" to ROOM_RATE * ChronoUnit.DAYS.between(checkIn, checkOut),
					"discountAmount" to 0,
					"totalAmount" to ROOM_RATE * ChronoUnit.DAYS.between(checkIn, checkOut),
					"cancellation" to cancellation,
				),
			),
		)

	private fun cancellation(hotelAdminId: Long, name: String, reason: String?): Map<String, Any?> =
		linkedMapOf("canceledAt" to NOW.toString(), "canceledBy" to linkedMapOf("id" to hotelAdminId, "name" to name), "reason" to reason)

	private fun histories(room: Room): List<List<Any?>> =
		jdbcTemplate.query(SELECT_HISTORIES, { rs, _ -> listOf(rs.getString(1), rs.getString(2), rs.getLong(3), rs.getString(4)) }, room.id)

	private fun itemIds(data: JsonNode): List<Long> = data["items"].values().map { it["id"].longValue() }

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

	private fun errorCodes(operation: JsonNode, status: HttpStatus): List<String> {
		val content = operation["responses"][status.value().toString()]["content"][JSON]
		val examples = content["example"]?.let { listOf(it) } ?: content["examples"].values().map { it["value"] }
		return examples.map { it["error"]["code"].stringValue() }
	}

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String, vararg arguments: Pair<String, String>): String =
		arguments.fold(messageSource.getMessage(key, null, Locale.KOREAN)) { text, (name, value) -> text.replace("{$name}", value) }

	companion object {
		private const val STAYS = ApiPaths.HOTEL_ADMIN + "/stays"
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val CAPACITY = 4
		private const val ROOM_RATE = 100000
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val SELECT_ROOM_STATUS = "select status from room where id = ?"
		private const val SELECT_STAY_IDS = "select id from stay where room_id = ? order by id"
		private const val SELECT_CANCELED_AT = "select canceled_at from stay where id = ?"
		private const val SELECT_HISTORIES = "select from_status, to_status, changed_by_id, changed_by_name from room_status_history where room_id = ? order by id"
		private const val UPDATE_ROOM_STATUS = "update room set status = ? where id = ?"
		private const val UPDATE_HOTEL_ADMIN_NAME = "update hotel_admin set name = ? where id = ?"
		private const val CANCEL_STAY = "update stay set canceled_at = now(), canceled_by_id = ?, canceled_by_name = '계정' where id = ?"
		private const val REF = "\$ref"
		private val DELETE_BY_HOTEL = listOf(
			"delete from stay where room_id in (select id from room where hotel_id = ?)",
			"delete from room_status_history where room_id in (select id from room where hotel_id = ?)",
			"delete from guest where hotel_id = ?",
			"delete from room where hotel_id = ?",
			"delete from room_type where hotel_id = ?",
			"delete from hotel_admin where hotel_id = ?",
		)
	}
}
