package com.marco.assignment.handys.urbanstay.room.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.EnumSource
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.node.ObjectNode
import java.math.BigInteger
import java.nio.charset.StandardCharsets
import java.time.LocalTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class RoomHotelAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var roomRepository: RoomRepository

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val executor = Executors.newFixedThreadPool(CONCURRENT_REQUESTS)

	private val suffix = UUID.randomUUID().toString().take(8)

	private val createdHotelIds = mutableListOf<Long>()

	private val xsrf: Cookie by lazy { checkNotNull(mockMvc.get(HOTEL_ADMIN_ME).andReturn().response.getCookie(XSRF_COOKIE)) }

	private lateinit var hotel: Hotel

	private lateinit var otherHotel: Hotel

	private lateinit var hotelAdmins: Map<HotelAdminRole, HotelAdmin>

	private lateinit var principals: Map<HotelAdminRole, UserDetails>

	private val masterPrincipal: UserDetails get() = principals.getValue(HotelAdminRole.MASTER)

	@BeforeEach
	fun createHotels() {
		hotel = saveHotel("어반스테이 $suffix")
		otherHotel = saveHotel("다른 호텔 $suffix")
		hotelAdmins = HotelAdminRole.entries.associateWith { role ->
			saveHotelAdmin(hotel, "${role.name.lowercase()}-$suffix@test.local", role, ACCOUNT_NAMES.getValue(role))
		}
		principals = hotelAdmins.mapValues { (_, hotelAdmin) -> HotelAdminPrincipal.from(hotelAdmin) }
		saveHotelAdmin(otherHotel, "other-master-$suffix@test.local", HotelAdminRole.MASTER)
	}

	@AfterEach
	fun deleteHotels() {
		executor.shutdownNow()
		createdHotelIds.forEach { jdbcTemplate.update(DELETE_HISTORIES, it) }
		createdHotelIds.forEach {
			jdbcTemplate.update(DELETE_ROOMS, it)
			jdbcTemplate.update(DELETE_HOTEL_ADMINS, it)
		}
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 자기 호텔에 객실을 등록하고 문자열은 앞뒤 공백을 지우고 공백만 있는 소개는 null로 저장해 201로 응답한다`(role: HotelAdminRole) {
		val body = createBody("name" to " 101\t", "type" to "\n스탠다드 ", "capacity" to 4, "floor" to -1, "description" to " 　 ", "checkInTime" to "14:30")

		val data = create(body, principals.getValue(role)).andExpectSuccess(HttpStatus.CREATED)

		val id = data["id"].longValue()
		assertThat(data).isEqualTo(roomJson(id, "101", "스탠다드", 4, -1, null, "14:30", CHECK_OUT, 0))
		assertThat(jdbcTemplate.queryForObject(SELECT_HOTEL_ID, Long::class.java, id)).isEqualTo(hotel.id)
		val saved = roomRepository.findById(id).orElseThrow()
		assertThat(listOf(saved.name, saved.type, saved.description, saved.checkInTime, saved.checkOutTime, saved.status, saved.version))
			.containsExactly("101", "스탠다드", null, LocalTime.of(14, 30), LocalTime.of(11, 0), RoomStatus.VACANT, 0L)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `객실을 등록하면 상태는 VACANT이고 등록한 계정의 id와 이름으로 이전 상태 없는 VACANT 이력을 한 줄 남긴다`(role: HotelAdminRole) {
		val data = create(createBody(), principals.getValue(role)).andExpectSuccess(HttpStatus.CREATED)

		assertThat(data["status"].stringValue()).isEqualTo(RoomStatus.VACANT.name)
		assertThat(histories(data["id"].longValue())).containsExactly(history(null, RoomStatus.VACANT, role))
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 자기 호텔의 객실을 조회하면 시각은 시와 분 두 자리씩의 문자열로, 수정에 쓸 version과 함께 200으로 응답한다`(role: HotelAdminRole) {
		val room = saveRoom(hotel, NAME, description = DESCRIPTION, checkInTime = LocalTime.of(9, 5), checkOutTime = LocalTime.of(0, 0))

		val data = getRoom(checkNotNull(room.id), principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(roomJson(room.id!!, NAME, ROOM_TYPE, CAPACITY, FLOOR, DESCRIPTION, "09:05", "00:00", 0))
	}

	@ParameterizedTest
	@ValueSource(booleans = [true, false])
	fun `층과 소개는 보내지 않거나 null이어도 등록한다`(omitted: Boolean) {
		val body = if (omitted) createBody() - "floor" - "description" else createBody("floor" to null, "description" to null)

		val data = create(body).andExpectSuccess(HttpStatus.CREATED)

		assertThat(listOf(data["floor"].isNull, data["description"].isNull)).containsExactly(true, true)
	}

	@ParameterizedTest
	@CsvSource("15:00, 15:00", "23:59, 00:00", "00:00, 23:59")
	fun `체크인과 체크아웃 시각의 앞뒤는 비교하지 않아 체크아웃이 체크인보다 이르거나 같아도 등록한다`(checkInTime: String, checkOutTime: String) {
		val data = create(createBody("checkInTime" to checkInTime, "checkOutTime" to checkOutTime)).andExpectSuccess(HttpStatus.CREATED)

		assertThat(listOf(data["checkInTime"].stringValue(), data["checkOutTime"].stringValue())).containsExactly(checkInTime, checkOutTime)
	}

	@Test
	fun `최대 길이는 앞뒤 공백을 지운 값으로 세고 최대 길이와 범위 끝 값은 등록한다`() {
		val name = "가".repeat(Room.NAME_MAX_LENGTH)
		val type = "나".repeat(Room.TYPE_MAX_LENGTH)
		val description = "다".repeat(Room.DESCRIPTION_MAX_LENGTH)

		val max = create(createBody("name" to " $name ", "type" to " $type ", "capacity" to 20, "floor" to 200, "description" to " $description "))
			.andExpectSuccess(HttpStatus.CREATED)
		val min = create(createBody("name" to "최소", "capacity" to 1, "floor" to -10)).andExpectSuccess(HttpStatus.CREATED)

		assertThat(listOf(max["name"], max["type"], max["capacity"], max["floor"], max["description"]).map { it.asString() })
			.containsExactly(name, type, "20", "200", description)
		assertThat(listOf(min["capacity"].intValue(), min["floor"].intValue())).containsExactly(1, -10)
	}

	@Test
	fun `앞뒤 공백을 지워도 최대 길이를 넘으면 필드마다 최대 길이 메시지로 400 응답하고 등록하지 않는다`() {
		val body = createBody(
			"name" to " ${"가".repeat(Room.NAME_MAX_LENGTH + 1)} ",
			"type" to "나".repeat(Room.TYPE_MAX_LENGTH + 1),
			"description" to "다".repeat(Room.DESCRIPTION_MAX_LENGTH + 1),
		)

		create(body).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"name" to maxLength(Room.NAME_MAX_LENGTH),
			"type" to maxLength(Room.TYPE_MAX_LENGTH),
			"description" to maxLength(Room.DESCRIPTION_MAX_LENGTH),
		)
		assertThat(roomNames(hotel)).isEmpty()
	}

	@ParameterizedTest
	@ValueSource(strings = ["", " ", "\t", "　"])
	fun `이름과 객실 유형이 비어 있거나 공백만 있으면 필드마다 필수 입력 메시지 하나로 400 응답한다`(value: String) {
		create(createBody("name" to value, "type" to value))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "name" to message(REQUIRED), "type" to message(REQUIRED))
	}

	@ParameterizedTest
	@CsvSource(
		"capacity, 0, validation.min, 1",
		"capacity, 21, validation.max, 20",
		"capacity, -1, validation.min, 1",
		"floor, -11, validation.min, -10",
		"floor, 201, validation.max, 200",
	)
	fun `최대 인원과 층이 범위를 벗어나면 범위 메시지 하나로 400 응답하고 등록하지 않는다`(field: String, value: Int, messageKey: String, bound: String) {
		create(createBody(field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(messageKey).replace("{value}", bound))
		assertThat(roomNames(hotel)).isEmpty()
	}

	@ParameterizedTest
	@MethodSource("invalidTimes")
	fun `체크인과 체크아웃 시각이 시와 분 두 자리씩인 문자열이 아니면 그 필드와 형식 메시지 하나로 400 응답하고 등록하지 않는다`(field: String, value: Any) {
		create(createBody(field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
		assertThat(roomNames(hotel)).isEmpty()
	}

	@ParameterizedTest
	@ValueSource(strings = ["name", "type", "capacity", "checkInTime", "checkOutTime"])
	fun `필수 항목이 없거나 null이면 필수 입력 메시지로 400 응답한다`(field: String) {
		create(createBody() - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		create(createBody(field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
	}

	@ParameterizedTest
	@MethodSource("typeMismatches")
	fun `항목에 다른 타입을 보내면 바꾸지 않고 형식 메시지로 400 응답한다`(field: String, value: Any) {
		create(createBody(field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
	}

	@ParameterizedTest
	@ValueSource(strings = ["hotelId", "version", "status"])
	fun `문서에 없는 호텔, version, 상태 항목을 보내면 알 수 없는 항목 메시지로 400 응답하고 등록하지 않는다`(field: String) {
		create(createBody(field to 1)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(UNKNOWN_FIELD))
		assertThat(roomNames(hotel)).isEmpty()
	}

	@Test
	fun `이름, 객실 유형, 최대 인원, 층, 소개의 검증 오류를 필드마다 하나씩 함께 응답한다`() {
		val body = createBody("name" to " ", "type" to "나".repeat(Room.TYPE_MAX_LENGTH + 1), "capacity" to 0, "floor" to 201, "description" to "다".repeat(1001))

		create(body).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"name" to message(REQUIRED),
			"type" to maxLength(Room.TYPE_MAX_LENGTH),
			"capacity" to message("validation.min").replace("{value}", "1"),
			"floor" to message("validation.max").replace("{value}", "200"),
			"description" to maxLength(Room.DESCRIPTION_MAX_LENGTH),
		)
	}

	@Test
	fun `같은 호텔에 앞뒤 공백을 지운 이름이 같은 객실을 등록하면 409 ROOM_DUPLICATED로 응답하고 등록하지 않는다`() {
		saveRoom(hotel, NAME)

		create(createBody("name" to " $NAME\t", "type" to "디럭스")).andExpectError(RoomErrorCode.ROOM_DUPLICATED)

		assertThat(roomNames(hotel)).containsExactly(NAME)
		assertThat(historyCount()).isZero()
	}

	@Test
	fun `다른 호텔의 객실과는 이름이 같아도 되고 대소문자만 다른 이름은 다른 객실로 등록한다`() {
		saveRoom(otherHotel, "Suite A")

		create(createBody("name" to "Suite A")).andExpectSuccess(HttpStatus.CREATED)
		create(createBody("name" to "SUITE A")).andExpectSuccess(HttpStatus.CREATED)

		assertThat(roomNames(hotel)).containsExactly("Suite A", "SUITE A")
		assertThat(roomNames(otherHotel)).containsExactly("Suite A")
	}

	@Test
	fun `같은 이름으로 동시에 등록하면 하나만 201로 등록되고 나머지는 409 ROOM_DUPLICATED로 응답한다`() {
		val responses = concurrently { index -> create(createBody("type" to "동시 등록 $index")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.CREATED.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, RoomErrorCode.ROOM_DUPLICATED)
		val winner = json(responses.single { it.status == HttpStatus.CREATED.value() })["data"]
		assertThat(roomIds(hotel)).containsExactly(winner["id"].longValue())
		assertThat(historyCount()).isEqualTo(1)
	}

	@Test
	fun `없는 id와 다른 호텔의 객실 id로 조회하거나 수정하면 모두 404 ROOM_NOT_FOUND로 응답하고 바꾸지 않는다`() {
		val otherRoom = saveRoom(otherHotel, NAME)

		listOf(MISSING_ID, checkNotNull(otherRoom.id)).forEach { id ->
			HotelAdminRole.entries.forEach { role ->
				getRoom(id, principals.getValue(role)).andExpectError(RoomErrorCode.ROOM_NOT_FOUND)
				update(id, updateBody(0, "type" to "디럭스"), principals.getValue(role)).andExpectError(RoomErrorCode.ROOM_NOT_FOUND)
			}
		}
		assertUnchanged(otherRoom)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 조회한 version으로 수정하면 모든 항목을 앞뒤 공백을 지운 값으로 바꾸고 version을 올려 200으로 응답한다`(role: HotelAdminRole) {
		val room = saveRoom(hotel, NAME, description = DESCRIPTION)
		val body = updateBody(
			0,
			"name" to " 스위트 A\t",
			"type" to " 디럭스 ",
			"capacity" to 20,
			"floor" to -10,
			"description" to " 새 소개 ",
			"checkInTime" to "16:30",
			"checkOutTime" to "10:00",
		)

		val data = update(room.id!!, body, principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(roomJson(room.id!!, "스위트 A", "디럭스", 20, -10, "새 소개", "16:30", "10:00", 1))
		assertThat(roomJson(reload(room))).isEqualTo(data)
	}

	@ParameterizedTest
	@ValueSource(booleans = [true, false])
	fun `수정 요청에 층과 소개를 보내지 않거나 null로 보내면 null로 바꾼다`(omitted: Boolean) {
		val room = saveRoom(hotel, NAME, description = DESCRIPTION)
		val body = if (omitted) updateBody(0) - "floor" - "description" else updateBody(0, "floor" to null, "description" to null)

		val data = update(room.id!!, body).andExpectSuccess(HttpStatus.OK)

		assertThat(listOf(data["floor"].isNull, data["description"].isNull, data["version"].longValue())).containsExactly(true, true, 1L)
		assertThat(listOf(reload(room).floor, reload(room).description)).containsExactly(null, null)
	}

	@Test
	fun `이름을 그대로 두고 나머지 항목만 수정할 수 있다`() {
		val room = saveRoom(hotel, NAME)

		val data = update(room.id!!, updateBody(0, "name" to " $NAME ", "type" to "디럭스")).andExpectSuccess(HttpStatus.OK)

		assertThat(listOf(data["name"].stringValue(), data["type"].stringValue(), data["version"].longValue())).containsExactly(NAME, "디럭스", 1L)
	}

	@Test
	fun `바뀐 값이 없는 수정은 version을 올리지 않고 200으로 응답한다`() {
		val room = saveRoom(hotel, NAME, description = DESCRIPTION)

		val data = update(room.id!!, updateBody(0, "name" to " $NAME ", "type" to " $ROOM_TYPE", "description" to "$DESCRIPTION\t")).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(roomJson(room))
		assertUnchanged(room)
	}

	@Test
	fun `같은 호텔의 다른 객실과 앞뒤 공백을 지운 이름이 같아지게 수정하면 409 ROOM_DUPLICATED로 응답하고 바꾸지 않는다`() {
		saveRoom(hotel, OTHER_NAME)
		val room = saveRoom(hotel, NAME)

		update(room.id!!, updateBody(0, "name" to " $OTHER_NAME ")).andExpectError(RoomErrorCode.ROOM_DUPLICATED)

		assertUnchanged(room)
	}

	@Test
	fun `다른 호텔의 객실과 같은 이름이나 대소문자만 다른 이름으로는 수정할 수 있다`() {
		saveRoom(otherHotel, "Suite A")
		saveRoom(hotel, "SUITE A")
		val room = saveRoom(hotel, NAME)

		val data = update(room.id!!, updateBody(0, "name" to "Suite A")).andExpectSuccess(HttpStatus.OK)

		assertThat(data["name"].stringValue()).isEqualTo("Suite A")
		assertThat(roomNames(hotel)).containsExactly("SUITE A", "Suite A")
	}

	@Test
	fun `같은 version으로 두 번 수정하면 먼저 수정한 쪽만 반영되고, version이 다르면서 이름도 겹치면 version 충돌인 409 ROOM_MODIFIED로 응답한다`() {
		saveRoom(hotel, OTHER_NAME)
		val room = saveRoom(hotel, NAME)

		update(room.id!!, updateBody(0, "type" to "먼저 수정")).andExpectSuccess(HttpStatus.OK)
		update(room.id!!, updateBody(0, "type" to "나중 수정")).andExpectError(RoomErrorCode.ROOM_MODIFIED)
		update(room.id!!, updateBody(0, "name" to OTHER_NAME)).andExpectError(RoomErrorCode.ROOM_MODIFIED)

		val saved = reload(room)
		assertThat(listOf(saved.name, saved.type, saved.version)).containsExactly(NAME, "먼저 수정", 1L)
	}

	@Test
	fun `같은 version으로 동시에 수정하면 하나만 200으로 반영되고 나머지는 409 ROOM_MODIFIED로 응답한다`() {
		val room = saveRoom(hotel, NAME)

		val responses = concurrently { index -> update(room.id!!, updateBody(0, "type" to "동시 수정 $index")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.OK.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, RoomErrorCode.ROOM_MODIFIED)
		val winner = json(responses.single { it.status == HttpStatus.OK.value() })["data"]
		assertThat(roomJson(reload(room))).isEqualTo(winner)
		assertThat(winner["version"].longValue()).isEqualTo(1)
	}

	@Test
	fun `서로 다른 객실을 같은 새 이름으로 동시에 바꾸면 하나만 200으로 반영되고 나머지는 409 ROOM_DUPLICATED로 응답한다`() {
		val rooms = listOf(saveRoom(hotel, NAME), saveRoom(hotel, OTHER_NAME))

		val responses = concurrently { index -> update(rooms[index].id!!, updateBody(0, "name" to "새 이름")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.OK.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, RoomErrorCode.ROOM_DUPLICATED)
		val winnerId = json(responses.single { it.status == HttpStatus.OK.value() })["data"]["id"].longValue()
		assertThat(rooms.map { reload(it).name }).containsOnlyOnce("새 이름")
		assertUnchanged(rooms.single { it.id != winnerId })
	}

	@Test
	fun `수정 요청도 등록과 같은 규칙으로 입력값을 검사하고 필드마다 오류 하나를 응답하며 바꾸지 않는다`() {
		val room = saveRoom(hotel, NAME)
		val body = updateBody(0, "name" to "　", "type" to "나".repeat(Room.TYPE_MAX_LENGTH + 1), "capacity" to 21, "floor" to -11, "description" to "다".repeat(1001))

		update(room.id!!, body).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"name" to message(REQUIRED),
			"type" to maxLength(Room.TYPE_MAX_LENGTH),
			"capacity" to message("validation.max").replace("{value}", "20"),
			"floor" to message("validation.min").replace("{value}", "-10"),
			"description" to maxLength(Room.DESCRIPTION_MAX_LENGTH),
		)
		update(room.id!!, updateBody(0, "checkInTime" to "15:00:00")).andExpectError(CommonErrorCode.INVALID_INPUT, "checkInTime" to message(TYPE))
		update(room.id!!, updateBody(0, "checkOutTime" to "9:30")).andExpectError(CommonErrorCode.INVALID_INPUT, "checkOutTime" to message(TYPE))
		assertUnchanged(room)
	}

	@ParameterizedTest
	@ValueSource(strings = ["name", "type", "capacity", "checkInTime", "checkOutTime", "version"])
	fun `수정 요청의 필수 항목이 없거나 null이면 필수 입력 메시지로 400 응답한다`(field: String) {
		val room = saveRoom(hotel, NAME)

		update(room.id!!, updateBody(0) - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		update(room.id!!, updateBody(0, field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		assertUnchanged(room)
	}

	@ParameterizedTest
	@MethodSource("updateTypeMismatches")
	fun `수정 요청 항목에 다른 타입을 보내면 형식 메시지로 400 응답한다`(field: String, value: Any) {
		val room = saveRoom(hotel, NAME)

		update(room.id!!, updateBody(0, field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
	}

	@Test
	fun `정수 항목, 객실 id, page가 타입 범위를 넘으면 그 이름과 형식 메시지로 400 응답하고 바꾸지 않는다`() {
		val room = saveRoom(hotel, NAME)

		create(createBody("capacity" to 3000000000L)).andExpectError(CommonErrorCode.INVALID_INPUT, "capacity" to message(TYPE))
		create(createBody("floor" to -3000000000L)).andExpectError(CommonErrorCode.INVALID_INPUT, "floor" to message(TYPE))
		update(room.id!!, updateBody(0, "version" to BigInteger("99999999999999999999")))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "version" to message(TYPE))
		mockMvc.get("$ROOMS/99999999999999999999") { with(user(masterPrincipal)) }.andExpectError(CommonErrorCode.INVALID_INPUT, "roomId" to message(TYPE))
		getRooms("page" to "99999999999").andExpectError(CommonErrorCode.INVALID_INPUT, "page" to message(TYPE))
		assertThat(roomNames(hotel)).containsExactly(NAME)
		assertUnchanged(room)
	}

	@ParameterizedTest
	@ValueSource(strings = ["id", "hotelId", "status"])
	fun `수정 요청에 문서에 없는 id나 호텔, 상태 항목을 보내면 알 수 없는 항목 메시지로 400 응답하고 바꾸지 않는다`(field: String) {
		val room = saveRoom(hotel, NAME)

		update(room.id!!, updateBody(0, field to checkNotNull(otherHotel.id))).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(UNKNOWN_FIELD))
		assertUnchanged(room)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 목록을 기본값 page 0, size 10으로 자기 호텔 객실만 이름 오름차순으로 조회한다`(role: HotelAdminRole) {
		val names = listOf("301", "99", "1001", "999", "101", "202", "102", "201", "103", "105", "104")
		names.forEach { saveRoom(hotel, it) }
		saveRoom(otherHotel, "100")

		val data = getRooms(principal = principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(itemNames(data)).containsExactly("99", "101", "102", "103", "104", "105", "201", "202", "301", "999")
		assertThat(pageInfo(data)).containsExactly(0, 10, 11, 2)
		val first = data["items"][0]
		assertThat(first).isEqualTo(roomJson(first["id"].longValue(), "99", ROOM_TYPE, CAPACITY, FLOOR, null, CHECK_IN, CHECK_OUT, 0))
		assertThat(itemNames(getRooms("page" to "1", principal = principals.getValue(role)).andExpectSuccess(HttpStatus.OK))).containsExactly("1001")
	}

	@Test
	fun `page와 size로 원하는 페이지를 조회한다`() {
		(1..7).forEach { saveRoom(hotel, "10$it") }

		val data = getRooms("page" to "1", "size" to "3").andExpectSuccess(HttpStatus.OK)

		assertThat(itemNames(data)).containsExactly("104", "105", "106")
		assertThat(pageInfo(data)).containsExactly(1, 3, 7, 3)
	}

	@Test
	fun `목록의 이름순은 이름 속 숫자를 숫자로 비교해 숫자, 영문, 한글 순이고 대소문자만 다르면 소문자가 먼저다`() {
		listOf("Deluxe", "스위트 A", "1001", "deluxe", "B동 101", "B동 99", "201", "101").forEach { saveRoom(hotel, it) }

		assertThat(itemNames(getRooms().andExpectSuccess(HttpStatus.OK)))
			.containsExactly("101", "201", "1001", "B동 99", "B동 101", "deluxe", "Deluxe", "스위트 A")
	}

	@ParameterizedTest
	@CsvSource("page, 99", "page, 0", "size, 100", "size, 1")
	fun `page와 size는 범위의 끝 값까지 받는다`(parameter: String, value: String) {
		saveRoom(hotel, NAME)

		val data = getRooms(parameter to value).andExpectSuccess(HttpStatus.OK)

		assertThat(data[parameter].asString()).isEqualTo(value)
	}

	@ParameterizedTest
	@CsvSource(
		"page, -1, validation.min, 0",
		"page, 100, validation.max, 99",
		"size, 0, validation.min, 1",
		"size, 101, validation.max, 100",
	)
	fun `범위를 벗어난 page와 size는 파라미터 이름과 범위 메시지로 400 응답한다`(parameter: String, value: String, messageKey: String, bound: String) {
		getRooms(parameter to value).andExpectError(CommonErrorCode.INVALID_INPUT, parameter to message(messageKey).replace("{value}", bound))
	}

	@Test
	fun `검색어가 이름에 들어 있는 자기 호텔 객실만 앞뒤 공백을 지우고 대소문자 구분 없이 이름 오름차순으로 조회한다`() {
		listOf("suite C", "디럭스 1", "SUITE A", "Suite B").forEach { saveRoom(hotel, it) }
		saveRoom(otherHotel, "Suite Z")

		val found = getRooms("keyword" to " sUiTe ").andExpectSuccess(HttpStatus.OK)
		val notFound = getRooms("keyword" to "없는 객실").andExpectSuccess(HttpStatus.OK)

		assertThat(itemNames(found)).containsExactly("SUITE A", "Suite B", "suite C")
		assertThat(pageInfo(found)).containsExactly(0, 10, 3, 1)
		assertThat(itemNames(notFound)).isEmpty()
		assertThat(pageInfo(notFound)).containsExactly(0, 10, 0, 0)
	}

	@ParameterizedTest
	@ValueSource(strings = ["", "   ", "　"])
	fun `검색어가 비어 있거나 공백만 있으면 거르지 않고 전체 목록을 조회한다`(keyword: String) {
		listOf("102", "101", "103").forEach { saveRoom(hotel, it) }

		assertThat(itemNames(getRooms("keyword" to keyword).andExpectSuccess(HttpStatus.OK))).containsExactly("101", "102", "103")
	}

	@ParameterizedTest
	@CsvSource("'50%', '50원'", "'a_b', 'axb'", "'c\\d', 'cd'")
	fun `검색어의 퍼센트, 밑줄, 역슬래시는 와일드카드가 아니라 글자 그대로 찾는다`(literal: String, decoy: String) {
		saveRoom(hotel, "객실 $literal")
		saveRoom(hotel, "객실 $decoy")

		assertThat(itemNames(getRooms("keyword" to literal).andExpectSuccess(HttpStatus.OK))).containsExactly("객실 $literal")
	}

	@Test
	fun `검색어는 앞뒤 공백을 지운 길이로 세어 100자를 넘으면 최대 길이 메시지로 400 응답한다`() {
		val max = RoomHotelAdminController.KEYWORD_MAX_LENGTH

		getRooms("keyword" to " ${"가".repeat(max)} ").andExpectSuccess(HttpStatus.OK)
		getRooms("keyword" to "가".repeat(max + 1)).andExpectError(CommonErrorCode.INVALID_INPUT, "keyword" to maxLength(max))
	}

	@Test
	fun `검색 결과도 page와 size로 나눠 조회하고 전체 수와 페이지 수는 검색 결과 기준이다`() {
		(1..5).forEach { saveRoom(hotel, "스위트 $it") }
		(1..3).forEach { saveRoom(hotel, "디럭스 $it") }

		val data = getRooms("keyword" to "스위트", "page" to "1", "size" to "2").andExpectSuccess(HttpStatus.OK)

		assertThat(itemNames(data)).containsExactly("스위트 3", "스위트 4")
		assertThat(pageInfo(data)).containsExactly(1, 2, 5, 3)
	}

	@Test
	fun `로그인하지 않으면 객실 API는 401 UNAUTHORIZED로 응답하고 바꾸지 않는다`() {
		val room = saveRoom(hotel, NAME)

		mockMvc.get(ROOMS).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get("$ROOMS/${room.id}").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get("$ROOMS/${room.id}/status-histories").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.post(ROOMS) { withCsrf(); jsonBody(createBody("name" to "102")) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.put("$ROOMS/${room.id}") { withCsrf(); jsonBody(updateBody(0, "type" to "디럭스")) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.put("$ROOMS/${room.id}/status") { withCsrf(); jsonBody(statusBody(RoomStatus.VACANT, RoomStatus.RESERVED)) }
			.andExpectError(CommonErrorCode.UNAUTHORIZED)
		assertThat(roomNames(hotel)).containsExactly(NAME)
		assertUnchanged(room)
		assertThat(historyCount()).isZero()
	}

	@Test
	fun `전체 어드민 역할로는 객실 API를 쓸 수 없어 403 FORBIDDEN으로 응답하고 바꾸지 않는다`() {
		val room = saveRoom(hotel, NAME)
		val appAdmin = User.withUsername(USERNAME).password(PASSWORD_HASH).roles(Role.APP_ADMIN.name).build()

		getRooms(principal = appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		getRoom(checkNotNull(room.id), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		getHistories(room.id!!, principal = appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		create(createBody("name" to "102"), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		update(room.id!!, updateBody(0, "type" to "디럭스"), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		assertThat(roomNames(hotel)).containsExactly(NAME)
		assertUnchanged(room)
		assertThat(historyCount()).isZero()
	}

	@Test
	fun `CSRF 토큰 없이 등록하거나 수정하거나 상태를 바꾸면 403 INVALID_CSRF_TOKEN으로 응답하고 바꾸지 않는다`() {
		val room = saveRoom(hotel, NAME)

		mockMvc.post(ROOMS) { with(user(masterPrincipal)); jsonBody(createBody("name" to "102")) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		mockMvc.put("$ROOMS/${room.id}") { with(user(masterPrincipal)); jsonBody(updateBody(0, "type" to "디럭스")) }
			.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		mockMvc.put("$ROOMS/${room.id}/status") { with(user(masterPrincipal)); jsonBody(statusBody(RoomStatus.VACANT, RoomStatus.RESERVED)) }
			.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		assertThat(roomNames(hotel)).containsExactly(NAME)
		assertUnchanged(room)
		assertThat(historyCount()).isZero()
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 허용된 변경으로 상태를 바꾸면 바뀐 상태와 그대로인 version으로 200 응답하고 바꾼 계정의 id와 이름으로 이력을 한 줄 남긴다`(
		role: HotelAdminRole,
	) {
		val room = saveRoom(hotel, NAME)

		val data = changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED), principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(roomJson(room.id!!, NAME, ROOM_TYPE, CAPACITY, FLOOR, null, CHECK_IN, CHECK_OUT, 0, RoomStatus.RESERVED))
		assertThat(roomJson(reload(room))).isEqualTo(data)
		assertThat(histories(room.id!!)).containsExactly(history(RoomStatus.VACANT, RoomStatus.RESERVED, role))
	}

	@Test
	fun `허용된 여섯 가지 변경은 모두 200으로 바꾸고 바꿀 때마다 이력을 한 줄씩 남긴다`() {
		val room = saveRoom(hotel, NAME)
		val changes = listOf(
			RoomStatus.VACANT to RoomStatus.RESERVED,
			RoomStatus.RESERVED to RoomStatus.OCCUPIED,
			RoomStatus.OCCUPIED to RoomStatus.MAINTENANCE,
			RoomStatus.MAINTENANCE to RoomStatus.VACANT,
			RoomStatus.VACANT to RoomStatus.MAINTENANCE,
			RoomStatus.MAINTENANCE to RoomStatus.VACANT,
			RoomStatus.VACANT to RoomStatus.RESERVED,
			RoomStatus.RESERVED to RoomStatus.VACANT,
		)

		val statuses = changes.map { (from, to) -> changeStatus(room.id!!, statusBody(from, to)).andExpectSuccess(HttpStatus.OK)["status"].stringValue() }

		assertThat(statuses).containsExactlyElementsOf(changes.map { it.second.name })
		assertThat(histories(room.id!!)).containsExactlyElementsOf(changes.map { (from, to) -> history(from, to, HotelAdminRole.MASTER) })
		assertThat(reload(room).version).isZero()
	}

	@Test
	fun `없는 id와 다른 호텔의 객실 id로 상태를 바꾸면 허용되지 않는 변경이어도 모두 404 ROOM_NOT_FOUND로 응답하고 바꾸지 않는다`() {
		val otherRoom = saveRoom(otherHotel, NAME)

		listOf(MISSING_ID, checkNotNull(otherRoom.id)).forEach { id ->
			HotelAdminRole.entries.forEach { role ->
				changeStatus(id, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED), principals.getValue(role)).andExpectError(RoomErrorCode.ROOM_NOT_FOUND)
				changeStatus(id, statusBody(RoomStatus.VACANT, RoomStatus.OCCUPIED), principals.getValue(role)).andExpectError(RoomErrorCode.ROOM_NOT_FOUND)
			}
		}
		assertUnchanged(otherRoom)
		assertThat(histories(otherRoom.id!!)).isEmpty()
	}

	@ParameterizedTest(name = "{0} -> {1}")
	@MethodSource("disallowedChanges")
	fun `허용되지 않는 변경과 같은 상태로의 변경은 409 ROOM_STATUS_TRANSITION_NOT_ALLOWED로 응답하고 바꾸지 않는다`(from: RoomStatus, to: RoomStatus) {
		val room = saveRoom(hotel, NAME).also { setStatus(it, from) }

		changeStatus(room.id!!, statusBody(from, to)).andExpectError(RoomErrorCode.ROOM_STATUS_TRANSITION_NOT_ALLOWED)

		assertThat(reload(room).status).isEqualTo(from)
		assertThat(histories(room.id!!)).isEmpty()
	}

	@Test
	fun `허용되지 않는 변경이면서 from도 지금 상태와 다르면 ROOM_STATUS_TRANSITION_NOT_ALLOWED가 먼저다`() {
		val room = saveRoom(hotel, NAME).also { setStatus(it, RoomStatus.RESERVED) }

		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.OCCUPIED)).andExpectError(RoomErrorCode.ROOM_STATUS_TRANSITION_NOT_ALLOWED)
		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.VACANT)).andExpectError(RoomErrorCode.ROOM_STATUS_TRANSITION_NOT_ALLOWED)

		assertThat(reload(room).status).isEqualTo(RoomStatus.RESERVED)
		assertThat(histories(room.id!!)).isEmpty()
	}

	@Test
	fun `허용된 변경이라도 그사이 다른 사용자가 먼저 바꿔 지금 상태가 from과 다르면 409 ROOM_STATUS_CHANGED로 응답하고 바꾸지 않는다`() {
		val room = saveRoom(hotel, NAME)
		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED), principals.getValue(HotelAdminRole.OPERATOR))
			.andExpectSuccess(HttpStatus.OK)

		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.MAINTENANCE)).andExpectError(RoomErrorCode.ROOM_STATUS_CHANGED)

		assertThat(reload(room).status).isEqualTo(RoomStatus.RESERVED)
		assertThat(histories(room.id!!)).containsExactly(history(RoomStatus.VACANT, RoomStatus.RESERVED, HotelAdminRole.OPERATOR))
	}

	@Test
	fun `같은 객실을 같은 from으로 동시에 다른 상태로 바꾸면 하나만 200으로 반영되고 나머지는 409 ROOM_STATUS_CHANGED로 응답하며 이력은 한 줄이다`() {
		val room = saveRoom(hotel, NAME)
		val targets = listOf(RoomStatus.RESERVED, RoomStatus.MAINTENANCE)

		val responses = concurrently { index -> changeStatus(room.id!!, statusBody(RoomStatus.VACANT, targets[index])).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.OK.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, RoomErrorCode.ROOM_STATUS_CHANGED)
		val winner = RoomStatus.valueOf(json(responses.single { it.status == HttpStatus.OK.value() })["data"]["status"].stringValue())
		assertThat(reload(room).status).isEqualTo(winner)
		assertThat(histories(room.id!!)).containsExactly(history(RoomStatus.VACANT, winner, HotelAdminRole.MASTER))
	}

	@Test
	fun `상태를 바꾼 뒤에도 그 전에 조회한 version으로 객실을 수정할 수 있고 수정은 상태를 바꾸지 않는다`() {
		val room = saveRoom(hotel, NAME)
		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED)).andExpectSuccess(HttpStatus.OK)

		val data = update(room.id!!, updateBody(0, "type" to "디럭스")).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(roomJson(room.id!!, NAME, "디럭스", CAPACITY, FLOOR, null, CHECK_IN, CHECK_OUT, 1, RoomStatus.RESERVED))
		assertThat(roomJson(reload(room))).isEqualTo(data)
	}

	@ParameterizedTest
	@ValueSource(strings = ["from", "to"])
	fun `상태 변경 요청의 from과 to가 없거나 null이면 필수 입력 메시지로 400 응답하고 바꾸지 않는다`(field: String) {
		val room = saveRoom(hotel, NAME)

		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED) - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED) + (field to null))
			.andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		assertUnchanged(room)
		assertThat(histories(room.id!!)).isEmpty()
	}

	@ParameterizedTest
	@MethodSource("invalidStatuses")
	fun `상태 변경 요청의 from과 to가 네 상태 이름이 아니면 형식 메시지로 400 응답하고 바꾸지 않는다`(field: String, value: Any) {
		val room = saveRoom(hotel, NAME)

		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED) + (field to value))
			.andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
		assertUnchanged(room)
		assertThat(histories(room.id!!)).isEmpty()
	}

	@Test
	fun `상태 변경 요청의 from과 to는 앞뒤에 공백이 붙은 상태 이름도 공백을 지운 이름으로 받는다`() {
		val room = saveRoom(hotel, NAME)

		val data = changeStatus(room.id!!, mapOf("from" to " VACANT", "to" to "RESERVED ")).andExpectSuccess(HttpStatus.OK)

		assertThat(data["status"].stringValue()).isEqualTo(RoomStatus.RESERVED.name)
		assertThat(histories(room.id!!)).containsExactly(history(RoomStatus.VACANT, RoomStatus.RESERVED, HotelAdminRole.MASTER))
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 객실의 상태 이력을 최신순으로 바꾼 계정의 id와 그때의 이름, 바꾼 시각과 함께 조회한다`(role: HotelAdminRole) {
		val roomId = create(createBody()).andExpectSuccess(HttpStatus.CREATED)["id"].longValue()
		changeStatus(roomId, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED), principals.getValue(role)).andExpectSuccess(HttpStatus.OK)
		changeStatus(roomId, statusBody(RoomStatus.RESERVED, RoomStatus.OCCUPIED)).andExpectSuccess(HttpStatus.OK)
		val (registered, reserved, occupied) = savedHistories(roomId)

		val data = getHistories(roomId, principal = principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(data["items"].values().toList()).containsExactly(
			historyJson(occupied, RoomStatus.RESERVED, RoomStatus.OCCUPIED, HotelAdminRole.MASTER),
			historyJson(reserved, RoomStatus.VACANT, RoomStatus.RESERVED, role),
			historyJson(registered, null, RoomStatus.VACANT, HotelAdminRole.MASTER),
		)
		assertThat(pageInfo(data)).containsExactly(0, 10, 3, 1)
	}

	@Test
	fun `상태 이력의 바꾼 시각은 저장된 마이크로초 정밀도 그대로의 UTC ISO 8601 문자열이고 초 아래 자릿수는 없거나 3자리씩이다`() {
		val room = saveRoom(hotel, NAME)
		insertHistory(room, null, RoomStatus.VACANT, HotelAdminRole.MASTER, "2026-10-30T15:59:32+09:00")
		insertHistory(room, RoomStatus.VACANT, RoomStatus.RESERVED, HotelAdminRole.MASTER, "2026-10-30T15:59:32.12+09:00")
		insertHistory(room, RoomStatus.RESERVED, RoomStatus.OCCUPIED, HotelAdminRole.MASTER, "2026-10-30T15:59:32.123456+09:00")

		val data = getHistories(room.id!!).andExpectSuccess(HttpStatus.OK)

		assertThat(data["items"].values().map { it["changedAt"].stringValue() })
			.containsExactly("2026-10-30T06:59:32.123456Z", "2026-10-30T06:59:32.120Z", "2026-10-30T06:59:32Z")
	}

	@Test
	fun `상태 이력은 바꾼 시각이 같으면 id 내림차순이고 page와 size로 나눠 조회하며 다른 객실의 이력은 나오지 않는다`() {
		val room = saveRoom(hotel, NAME)
		val ids = listOf("00:00:01", "00:00:02", "00:00:02", "00:00:03", "00:00:04").map { time ->
			insertHistory(room, RoomStatus.VACANT, RoomStatus.RESERVED, HotelAdminRole.MASTER, "2026-10-30T${time}Z")
		}
		insertHistory(saveRoom(hotel, OTHER_NAME), null, RoomStatus.VACANT, HotelAdminRole.MASTER, "2026-10-31T00:00:00Z")

		val first = getHistories(room.id!!, "size" to "2").andExpectSuccess(HttpStatus.OK)
		val second = getHistories(room.id!!, "page" to "1", "size" to "2").andExpectSuccess(HttpStatus.OK)
		val last = getHistories(room.id!!, "page" to "2", "size" to "2").andExpectSuccess(HttpStatus.OK)

		assertThat(listOf(first, second, last).map { page -> page["items"].values().map { it["id"].longValue() } })
			.containsExactly(listOf(ids[4], ids[3]), listOf(ids[2], ids[1]), listOf(ids[0]))
		assertThat(pageInfo(second)).containsExactly(1, 2, 5, 3)
	}

	@Test
	fun `이름을 바꾼 계정의 이전 이력은 바꿀 때의 이름 그대로이고 계정이 비활성화돼도 그대로 보인다`() {
		val room = saveRoom(hotel, NAME)
		val operator = principals.getValue(HotelAdminRole.OPERATOR)
		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED), operator).andExpectSuccess(HttpStatus.OK)
		updateOperator { it.update(it.loginId, RENAMED_OPERATOR) }
		changeStatus(room.id!!, statusBody(RoomStatus.RESERVED, RoomStatus.OCCUPIED), operator).andExpectSuccess(HttpStatus.OK)
		updateOperator { it.changeActive(false) }

		val data = getHistories(room.id!!).andExpectSuccess(HttpStatus.OK)

		assertThat(data["items"].values().map { it["changedBy"] }).containsExactly(
			changedByJson(HotelAdminRole.OPERATOR, RENAMED_OPERATOR),
			changedByJson(HotelAdminRole.OPERATOR, ACCOUNT_NAMES.getValue(HotelAdminRole.OPERATOR)),
		)
	}

	@Test
	fun `없는 id와 다른 호텔의 객실 id로 상태 이력을 조회하면 모두 404 ROOM_NOT_FOUND로 응답한다`() {
		val otherRoom = saveRoom(otherHotel, NAME)
		insertHistory(otherRoom, null, RoomStatus.VACANT, HotelAdminRole.MASTER, "2026-10-30T00:00:00Z")

		listOf(MISSING_ID, checkNotNull(otherRoom.id)).forEach { id ->
			HotelAdminRole.entries.forEach { role -> getHistories(id, principal = principals.getValue(role)).andExpectError(RoomErrorCode.ROOM_NOT_FOUND) }
		}
	}

	@ParameterizedTest
	@CsvSource(
		"page, -1, validation.min, 0",
		"page, 100, validation.max, 99",
		"size, 0, validation.min, 1",
		"size, 101, validation.max, 100",
	)
	fun `상태 이력의 범위를 벗어난 page와 size는 파라미터 이름과 범위 메시지로 400 응답한다`(parameter: String, value: String, messageKey: String, bound: String) {
		val room = saveRoom(hotel, NAME)

		getHistories(room.id!!, parameter to value)
			.andExpectError(CommonErrorCode.INVALID_INPUT, parameter to message(messageKey).replace("{value}", bound))
	}

	@ParameterizedTest
	@CsvSource("page, 99", "size, 1", "size, 100")
	fun `상태 이력의 page와 size는 범위의 끝 값까지 받는다`(parameter: String, value: String) {
		val room = saveRoom(hotel, NAME)

		assertThat(getHistories(room.id!!, parameter to value).andExpectSuccess(HttpStatus.OK)[parameter].asString()).isEqualTo(value)
	}

	@ParameterizedTest
	@ValueSource(strings = ["status", "version"])
	fun `상태 변경 요청에 문서에 없는 항목을 보내면 알 수 없는 항목 메시지로 400 응답하고 바꾸지 않는다`(field: String) {
		val room = saveRoom(hotel, NAME)

		changeStatus(room.id!!, statusBody(RoomStatus.VACANT, RoomStatus.RESERVED) + (field to 0))
			.andExpectError(CommonErrorCode.INVALID_INPUT, field to message(UNKNOWN_FIELD))
		assertUnchanged(room)
	}

	@Test
	fun `객실 API 문서는 room 태그에 operation마다 낼 수 있는 객실 에러를 예시로 보여준다`() {
		val docs = apiDocs()
		val rooms = docs["paths"][ROOMS]
		val room = docs["paths"]["$ROOMS/{roomId}"]
		val status = docs["paths"]["$ROOMS/{roomId}/status"]
		val histories = docs["paths"]["$ROOMS/{roomId}/status-histories"]
		val operations = listOf(rooms["post"], rooms["get"], room["get"], room["put"], status["put"], histories["get"])

		assertThat(operations.map { it["operationId"].stringValue() })
			.containsExactly("createRoom", "getRooms", "getRoom", "updateRoom", "updateRoomStatus", "getRoomStatusHistories")
		assertThat(operations.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("room"))
		assertThat(docs["tags"].values().single { it["name"].stringValue() == "room" }["description"].stringValue())
			.isEqualTo(message("openapi.hotel-admin.tag.room"))
		operations.forEach { operation ->
			assertThat(errorCodes(operation, HttpStatus.UNAUTHORIZED)).containsExactly(CommonErrorCode.UNAUTHORIZED.code)
			assertThat(errorCodes(operation, HttpStatus.FORBIDDEN)).contains(CommonErrorCode.FORBIDDEN.code)
		}
		assertThat(rooms["post"]["responses"].propertyNames()).containsExactlyInAnyOrder("201", "400", "401", "403", "409", "500")
		assertThat(errorCodes(rooms["post"], HttpStatus.CONFLICT)).containsExactly(RoomErrorCode.ROOM_DUPLICATED.code)
		assertThat(rooms["post"]["responses"]["201"]["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponseRoomHotelAdminResponse"))
		assertThat(rooms["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(room["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "500")
		listOf(room["get"], room["put"]).forEach { op ->
			assertThat(errorCodes(op, HttpStatus.NOT_FOUND)).containsExactly(RoomErrorCode.ROOM_NOT_FOUND.code)
			assertThat(op["parameters"].values().map { it["name"].stringValue() }).containsExactly("roomId")
		}
		assertThat(room["put"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "409", "500")
		assertThat(errorCodes(room["put"], HttpStatus.CONFLICT)).containsExactlyInAnyOrder(RoomErrorCode.ROOM_DUPLICATED.code, RoomErrorCode.ROOM_MODIFIED.code)
		assertThat(room["put"]["responses"]["200"]["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponseRoomHotelAdminResponse"))
		assertThat(status["put"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "409", "500")
		assertThat(errorCodes(status["put"], HttpStatus.NOT_FOUND)).containsExactly(RoomErrorCode.ROOM_NOT_FOUND.code)
		assertThat(errorCodes(status["put"], HttpStatus.CONFLICT))
			.containsExactlyInAnyOrder(RoomErrorCode.ROOM_STATUS_TRANSITION_NOT_ALLOWED.code, RoomErrorCode.ROOM_STATUS_CHANGED.code)
		assertThat(errorCodes(status["put"], HttpStatus.FORBIDDEN)).contains(CommonErrorCode.INVALID_CSRF_TOKEN.code)
		assertThat(status["put"]["parameters"].values().map { it["name"].stringValue() }).containsExactly("roomId")
		assertThat(status["put"]["requestBody"]["content"][JSON]["schema"]).isEqualTo(schemaRef("RoomStatusUpdateHotelAdminRequest"))
		assertThat(status["put"]["responses"]["200"]["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponseRoomHotelAdminResponse"))
		assertThat(histories["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "500")
		assertThat(errorCodes(histories["get"], HttpStatus.NOT_FOUND)).containsExactly(RoomErrorCode.ROOM_NOT_FOUND.code)
	}

	@Test
	fun `상태 이력 문서는 page·size 파라미터와 최신순 페이지 응답, nullable 이전 상태와 date-time 형식의 바꾼 시각을 보여준다`() {
		val docs = apiDocs()
		val operation = docs["paths"]["$ROOMS/{roomId}/status-histories"]["get"]
		val parameters = operation["parameters"].values().associateBy { it["name"].stringValue() }
		val schemas = docs["components"]["schemas"]
		val history = schemas["RoomStatusHistoryHotelAdminResponse"]
		val properties = history["properties"]

		assertThat(parameters.keys).containsExactly("roomId", "page", "size")
		assertThat(listOf("page", "size").map { parameters.getValue(it)["description"].stringValue() })
			.containsExactlyElementsOf(listOf("page", "size").map { message("openapi.hotel-admin.operation.getRoomStatusHistories.parameter.$it") })
		assertThat(parameters.getValue("page")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":0,"minimum":0,"maximum":99}"""))
		assertThat(parameters.getValue("size")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":10,"minimum":1,"maximum":100}"""))
		assertThat(operation["responses"]["200"]["content"][JSON]["schema"])
			.isEqualTo(schemaRef("ApiResponsePageResponseRoomStatusHistoryHotelAdminResponse"))
		assertThat(schemas["PageResponseRoomStatusHistoryHotelAdminResponse"]["properties"]["items"]["items"])
			.isEqualTo(schemaRef("RoomStatusHistoryHotelAdminResponse"))
		assertThat(required(history)).containsExactlyInAnyOrder("id", "fromStatus", "toStatus", "changedBy", "changedAt")
		assertThat(properties.properties().filter { (_, property) -> "null" in types(property) }.map { it.key }).containsExactly("fromStatus")
		assertThat(types(properties["fromStatus"])).containsExactly("string", "null")
		assertThat(enumValues(properties["fromStatus"])).containsExactlyElementsOf(STATUS_NAMES)
		assertThat(types(properties["toStatus"])).containsExactly("string")
		assertThat(enumValues(properties["toStatus"])).containsExactlyElementsOf(STATUS_NAMES)
		assertThat(types(properties["changedAt"])).containsExactly("string")
		assertThat(properties["changedAt"]["format"].stringValue()).isEqualTo("date-time")
		assertThat(properties["changedAt"]["example"].stringValue()).isEqualTo("2026-10-30T06:59:32.123456Z")
		assertThat(properties["changedBy"]["\$ref"].stringValue()).isEqualTo("#/components/schemas/RoomStatusHistoryChangedByHotelAdminResponse")
		assertThat(required(schemas["RoomStatusHistoryChangedByHotelAdminResponse"])).containsExactlyInAnyOrder("id", "name")
	}

	@Test
	fun `상태 변경 요청 문서는 from과 to가 네 상태 이름의 필수 enum이고 예시를 보여준다`() {
		val request = apiDocs()["components"]["schemas"]["RoomStatusUpdateHotelAdminRequest"]
		val properties = request["properties"]

		assertThat(properties.propertyNames()).containsExactlyInAnyOrder("from", "to")
		assertThat(required(request)).containsExactlyInAnyOrder("from", "to")
		listOf("from", "to").forEach { field ->
			assertThat(types(properties[field])).containsExactly("string")
			assertThat(enumValues(properties[field])).containsExactlyElementsOf(STATUS_NAMES)
			assertThat(properties[field]["description"].stringValue()).isEqualTo(message("openapi.schema.RoomStatusUpdateHotelAdminRequest.$field"))
		}
		assertThat(listOf(properties["from"]["example"].stringValue(), properties["to"]["example"].stringValue())).containsExactly("VACANT", "RESERVED")
	}

	@Test
	fun `객실 목록 문서는 검색어, page·size 파라미터와 모든 필드가 필수인 페이지 응답 스키마를 보여준다`() {
		val docs = apiDocs()
		val getRooms = docs["paths"][ROOMS]["get"]
		val parameters = getRooms["parameters"].values().associateBy { it["name"].stringValue() }
		val page = docs["components"]["schemas"]["PageResponseRoomHotelAdminResponse"]

		assertThat(parameters.keys).containsExactly("keyword", "page", "size")
		assertThat(parameters.values.map { it["description"].stringValue() })
			.containsExactlyElementsOf(parameters.keys.map { message("openapi.hotel-admin.operation.getRooms.parameter.$it") })
		assertThat(parameters.values.map { it["required"].booleanValue() }).containsOnly(false)
		assertThat(parameters.getValue("keyword")["schema"]).isEqualTo(json("""{"type":"string","maxLength":100,"minLength":0}"""))
		assertThat(parameters.getValue("page")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":0,"minimum":0,"maximum":99}"""))
		assertThat(parameters.getValue("size")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":10,"minimum":1,"maximum":100}"""))
		assertThat(getRooms["responses"]["200"]["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponsePageResponseRoomHotelAdminResponse"))
		assertThat(required(page)).containsExactlyInAnyOrder("items", "page", "size", "totalElements", "totalPages")
		assertThat(page["properties"]["items"]["items"]).isEqualTo(schemaRef("RoomHotelAdminResponse"))
	}

	@ParameterizedTest
	@CsvSource("RoomCreateHotelAdminRequest, false", "RoomUpdateHotelAdminRequest, true")
	fun `객실 요청 문서는 필수 항목과 문자열 길이, 정수 범위, 시각 형식을 보여주고 층과 소개는 선택이며 수정에는 version이 필수다`(schema: String, hasVersion: Boolean) {
		val request = apiDocs()["components"]["schemas"][schema]
		val required = listOf("name", "type", "capacity", "checkInTime", "checkOutTime") + if (hasVersion) listOf("version") else emptyList()

		assertThat(request["properties"].propertyNames()).containsExactlyInAnyOrderElementsOf(required + listOf("floor", "description"))
		assertThat(required(request)).containsExactlyInAnyOrderElementsOf(required)
		assertRequestRules(request)
	}

	@Test
	fun `객실 응답 문서는 모든 필드가 필수이고 층과 소개는 null을 허용하며 시각 형식과 상태 값 목록을 보여준다`() {
		val response = apiDocs()["components"]["schemas"]["RoomHotelAdminResponse"]
		val properties = response["properties"]

		assertThat(required(response))
			.containsExactlyInAnyOrder("id", "name", "type", "capacity", "floor", "description", "checkInTime", "checkOutTime", "status", "version")
		assertThat(properties.properties().filter { (_, property) -> "null" in types(property) }.map { it.key })
			.containsExactlyInAnyOrder("floor", "description")
		listOf("checkInTime", "checkOutTime").forEach { field ->
			assertThat(types(properties[field])).containsExactly("string")
			assertThat(properties[field]["pattern"].stringValue()).isEqualTo(JacksonConfig.LOCAL_TIME_PATTERN)
		}
		assertThat(types(properties["status"])).containsExactly("string")
		assertThat(enumValues(properties["status"])).containsExactlyElementsOf(STATUS_NAMES)
		assertThat(properties["status"]["example"].stringValue()).isEqualTo("VACANT")
	}

	private fun assertRequestRules(request: JsonNode) {
		val properties = request["properties"]
		val lengths = listOf("name", "type", "description").associateWith { field -> listOf("minLength", "maxLength").map { properties[field][it]?.intValue() } }
		val ranges = listOf("capacity", "floor").associateWith { field -> listOf("minimum", "maximum").map { properties[field][it]?.intValue() } }

		assertThat(lengths).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"name" to listOf(1, Room.NAME_MAX_LENGTH),
				"type" to listOf(1, Room.TYPE_MAX_LENGTH),
				"description" to listOf(0, Room.DESCRIPTION_MAX_LENGTH),
			),
		)
		assertThat(ranges).containsExactlyInAnyOrderEntriesOf(mapOf("capacity" to listOf(1, 20), "floor" to listOf(-10, 200)))
		assertThat(listOf("floor", "description").map { "null" in types(properties[it]) }).containsOnly(true)
		mapOf("checkInTime" to "15:00", "checkOutTime" to "11:00").forEach { (field, example) ->
			assertThat(types(properties[field])).containsExactly("string")
			assertThat(properties[field]["pattern"].stringValue()).isEqualTo(JacksonConfig.LOCAL_TIME_PATTERN)
			assertThat(properties[field]["example"].stringValue()).isEqualTo(example)
		}
	}

	private fun create(body: Map<String, Any?>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.post(ROOMS) {
			with(user(principal))
			withCsrf()
			jsonBody(body)
		}

	private fun getRooms(vararg params: Pair<String, String>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get(ROOMS) {
			with(user(principal))
			params.forEach { (name, value) -> param(name, value) }
		}

	private fun getRoom(id: Long, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get("$ROOMS/$id") { with(user(principal)) }

	private fun update(id: Long, body: Map<String, Any?>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.put("$ROOMS/$id") {
			with(user(principal))
			withCsrf()
			jsonBody(body)
		}

	private fun getHistories(roomId: Long, vararg params: Pair<String, String>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get("$ROOMS/$roomId/status-histories") {
			with(user(principal))
			params.forEach { (name, value) -> param(name, value) }
		}

	private fun changeStatus(id: Long, body: Map<String, Any?>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.put("$ROOMS/$id/status") {
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

	private fun createBody(vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>(
			"name" to NAME,
			"type" to ROOM_TYPE,
			"capacity" to CAPACITY,
			"floor" to FLOOR,
			"description" to DESCRIPTION,
			"checkInTime" to CHECK_IN,
			"checkOutTime" to CHECK_OUT,
		) + overrides

	private fun updateBody(version: Long, vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		createBody("description" to null) + ("version" to version) + overrides

	private fun statusBody(from: RoomStatus, to: RoomStatus): Map<String, Any?> = linkedMapOf("from" to from.name, "to" to to.name)

	private fun setStatus(room: Room, status: RoomStatus) {
		jdbcTemplate.update(UPDATE_STATUS, status.name, room.id)
	}

	private fun histories(roomId: Long): List<HistoryRow> =
		jdbcTemplate.query(SELECT_HISTORIES, { rs, _ ->
			HistoryRow(rs.getString("from_status"), rs.getString("to_status"), rs.getLong("changed_by_id"), rs.getString("changed_by_name"))
		}, roomId)

	private fun history(from: RoomStatus?, to: RoomStatus, role: HotelAdminRole): HistoryRow =
		HistoryRow(from?.name, to.name, checkNotNull(hotelAdmins.getValue(role).id), ACCOUNT_NAMES.getValue(role))

	private fun historyCount(): Int = checkNotNull(jdbcTemplate.queryForObject(COUNT_HISTORIES, Int::class.java, hotel.id))

	private fun insertHistory(room: Room, from: RoomStatus?, to: RoomStatus, role: HotelAdminRole, changedAt: String): Long =
		checkNotNull(
			jdbcTemplate.queryForObject(
				INSERT_HISTORY,
				Long::class.java,
				room.id,
				from?.name,
				to.name,
				hotelAdmins.getValue(role).id,
				ACCOUNT_NAMES.getValue(role),
				changedAt,
				changedAt,
			),
		)

	private fun savedHistories(roomId: Long): List<SavedHistory> =
		jdbcTemplate.query(SELECT_HISTORY_TIMES, { rs, _ ->
			SavedHistory(rs.getLong("id"), rs.getObject("created_at", OffsetDateTime::class.java).toInstant().toString())
		}, roomId)

	private fun historyJson(saved: SavedHistory, from: RoomStatus?, to: RoomStatus, role: HotelAdminRole): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to saved.id,
					"fromStatus" to from?.name,
					"toStatus" to to.name,
					"changedBy" to linkedMapOf("id" to hotelAdmins.getValue(role).id, "name" to ACCOUNT_NAMES.getValue(role)),
					"changedAt" to saved.changedAt,
				),
			),
		)

	private fun changedByJson(role: HotelAdminRole, name: String): JsonNode =
		json(jsonMapper.writeValueAsString(linkedMapOf("id" to hotelAdmins.getValue(role).id, "name" to name)))

	private fun updateOperator(change: (HotelAdmin) -> Unit) {
		val operator = hotelAdminRepository.findById(checkNotNull(hotelAdmins.getValue(HotelAdminRole.OPERATOR).id)).orElseThrow()
		change(operator)
		hotelAdminRepository.save(operator)
	}

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, loginId: String, role: HotelAdminRole, name: String = "계정"): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, PASSWORD_HASH, name, role))

	private fun saveRoom(
		hotel: Hotel,
		name: String,
		description: String? = null,
		checkInTime: LocalTime = LocalTime.of(15, 0),
		checkOutTime: LocalTime = LocalTime.of(11, 0),
	): Room = roomRepository.save(Room(hotel, name, ROOM_TYPE, CAPACITY, FLOOR, description, checkInTime, checkOutTime))

	private fun reload(room: Room): Room = roomRepository.findById(checkNotNull(room.id)).orElseThrow()

	private fun assertUnchanged(room: Room) {
		assertThat(roomJson(reload(room))).isEqualTo(roomJson(room))
	}

	private fun roomNames(hotel: Hotel): List<String> =
		jdbcTemplate.queryForList(SELECT_ROOM_NAMES, String::class.java, hotel.id).filterNotNull()

	private fun roomIds(hotel: Hotel): List<Long> =
		jdbcTemplate.queryForList(SELECT_ROOM_IDS, Long::class.javaObjectType, hotel.id).filterNotNull()

	private fun <T> concurrently(request: (Int) -> T): List<T> {
		val start = CountDownLatch(1)
		val futures = (0 until CONCURRENT_REQUESTS).map { index -> executor.submit(Callable { start.await(); request(index) }) }
		start.countDown()
		return futures.map { it.get(TIMEOUT_SECONDS, TimeUnit.SECONDS) }
	}

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus): JsonNode {
		val response = andReturn().response
		val body = json(response)
		assertThat(response.status).isEqualTo(status.value())
		assertThat(body.properties().map { it.key }).containsExactly("success", "data", "error")
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["error"].isNull).isTrue()
		return body["data"]
	}

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) =
		assertError(andReturn().response, errorCode, *fieldErrors)

	private fun assertError(response: MockHttpServletResponse, errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) {
		val body = json(response)
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().map { it["field"].stringValue() to it["message"].stringValue() }
		val expected = mapOf("success" to false, "data" to null, "error" to mapOf("code" to errorCode.code, "message" to message(errorCode.messageKey)))

		assertThat(response.status).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json(jsonMapper.writeValueAsString(expected)))
		assertThat(actualFieldErrors).containsExactlyInAnyOrder(*fieldErrors)
	}

	private fun roomJson(
		id: Long,
		name: String,
		type: String,
		capacity: Int,
		floor: Int?,
		description: String?,
		checkInTime: String,
		checkOutTime: String,
		version: Long,
		status: RoomStatus = RoomStatus.VACANT,
	): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to id,
					"name" to name,
					"type" to type,
					"capacity" to capacity,
					"floor" to floor,
					"description" to description,
					"checkInTime" to checkInTime,
					"checkOutTime" to checkOutTime,
					"status" to status.name,
					"version" to version,
				),
			),
		)

	private fun roomJson(room: Room): JsonNode =
		roomJson(
			checkNotNull(room.id),
			room.name,
			room.type,
			room.capacity,
			room.floor,
			room.description,
			room.checkInTime.format(TIME_FORMAT),
			room.checkOutTime.format(TIME_FORMAT),
			room.version,
			room.status,
		)

	private fun itemNames(data: JsonNode): List<String> = data["items"].values().map { it["name"].stringValue() }

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

	private fun errorCodes(operation: JsonNode, status: HttpStatus): List<String> {
		val content = operation["responses"][status.value().toString()]["content"][JSON]
		val examples = content["example"]?.let { listOf(it) } ?: content["examples"].values().map { it["value"] }
		return examples.map { it["error"]["code"].stringValue() }
	}

	private fun required(schema: JsonNode): List<String> = schema.path("required").values().map { it.stringValue() }

	private fun types(property: JsonNode): List<String> =
		property.path("type").let { type -> if (type.isArray) type.values().map { it.stringValue() } else listOfNotNull(type.stringValue(null)) }

	private fun enumValues(property: JsonNode): List<String?> = property.path("enum").values().map { it.stringValue(null) }

	private fun schemaRef(name: String): JsonNode = json("""{"${'$'}ref":"#/components/schemas/$name"}""")

	private fun json(response: MockHttpServletResponse): JsonNode = json(response.getContentAsString(StandardCharsets.UTF_8))

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private fun maxLength(max: Int): String = message(MAX_LENGTH).replace("{max}", max.toString())

	private data class HistoryRow(val from: String?, val to: String, val changedById: Long, val changedByName: String)

	private data class SavedHistory(val id: Long, val changedAt: String)

	companion object {
		private const val ROOMS = ApiPaths.HOTEL_ADMIN + "/rooms"
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val USERNAME = "tester"
		private const val NAME = "101"
		private const val OTHER_NAME = "102"
		private const val ROOM_TYPE = "스탠다드"
		private const val CAPACITY = 2
		private const val FLOOR = 1
		private const val DESCRIPTION = "창이 큰 객실"
		private const val CHECK_IN = "15:00"
		private const val CHECK_OUT = "11:00"
		private val TIME_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val REQUIRED = "validation.required"
		private const val TYPE = "validation.type"
		private const val MAX_LENGTH = "validation.max-length"
		private const val UNKNOWN_FIELD = "validation.unknown-field"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val CONCURRENT_REQUESTS = 2
		private const val TIMEOUT_SECONDS = 10L
		private val ACCOUNT_NAMES = mapOf(HotelAdminRole.MASTER to "마스터 홍길동", HotelAdminRole.OPERATOR to "운영자 김철수")
		private val STATUS_NAMES = RoomStatus.entries.map { it.name }
		private const val DELETE_HISTORIES = "delete from room_status_history where room_id in (select id from room where hotel_id = ?)"
		private const val DELETE_ROOMS = "delete from room where hotel_id = ?"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val UPDATE_STATUS = "update room set status = ? where id = ?"
		private const val SELECT_HISTORIES = "select from_status, to_status, changed_by_id, changed_by_name from room_status_history where room_id = ? order by id"
		private const val COUNT_HISTORIES = "select count(*) from room_status_history h join room r on r.id = h.room_id where r.hotel_id = ?"
		private const val SELECT_HISTORY_TIMES = "select id, created_at from room_status_history where room_id = ? order by id"
		private const val INSERT_HISTORY = """
			insert into room_status_history (room_id, from_status, to_status, changed_by_id, changed_by_name, created_at, updated_at)
			values (?, ?, ?, ?, ?, cast(? as timestamptz), cast(? as timestamptz))
			returning id
		"""
		private const val RENAMED_OPERATOR = "운영자 이영희"
		private const val SELECT_HOTEL_ID = "select hotel_id from room where id = ?"
		private const val SELECT_ROOM_NAMES = "select name from room where hotel_id = ? order by id"
		private const val SELECT_ROOM_IDS = "select id from room where hotel_id = ? order by id"

		@JvmStatic
		fun invalidTimes(): List<Arguments> =
			listOf("checkInTime", "checkOutTime").flatMap { field ->
				listOf<Any>("15:00:00", "9:30", "24:00", "15:60", "1500", " 15:00", "", "오후 3시", 1500, 15.5, listOf(15, 0)).map { Arguments.of(field, it) }
			}

		@JvmStatic
		fun typeMismatches(): List<Arguments> = listOf(
			Arguments.of("name", 101),
			Arguments.of("type", listOf("스탠다드")),
			Arguments.of("capacity", "2"),
			Arguments.of("capacity", 2.5),
			Arguments.of("floor", "1"),
			Arguments.of("floor", true),
			Arguments.of("description", 1),
		)

		@JvmStatic
		fun disallowedChanges(): List<Arguments> =
			RoomStatus.entries.flatMap { from -> RoomStatus.entries.filterNot(from::canChangeTo).map { to -> Arguments.of(from, to) } }

		@JvmStatic
		fun invalidStatuses(): List<Arguments> =
			listOf("from", "to").flatMap { field ->
				listOf<Any>("vacant", "Vacant", "CLEANING", "VA CANT", "", " ", "0", 0, 1, true, listOf("VACANT"), mapOf("name" to "VACANT"))
					.map { Arguments.of(field, it) }
			}

		@JvmStatic
		fun updateTypeMismatches(): List<Arguments> = listOf(
			Arguments.of("version", "0"),
			Arguments.of("version", 0.5),
			Arguments.of("version", true),
			Arguments.of("capacity", "2"),
			Arguments.of("checkInTime", 1500),
			Arguments.of("name", listOf("101")),
		)
	}
}
