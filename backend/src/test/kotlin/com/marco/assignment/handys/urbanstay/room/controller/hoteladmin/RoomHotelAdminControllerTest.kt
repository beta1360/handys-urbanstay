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
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.node.ObjectNode
import java.nio.charset.StandardCharsets
import java.time.LocalTime
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

	private lateinit var principals: Map<HotelAdminRole, UserDetails>

	private val masterPrincipal: UserDetails get() = principals.getValue(HotelAdminRole.MASTER)

	@BeforeEach
	fun createHotels() {
		hotel = saveHotel("어반스테이 $suffix")
		otherHotel = saveHotel("다른 호텔 $suffix")
		principals = HotelAdminRole.entries.associateWith { role ->
			HotelAdminPrincipal.from(saveHotelAdmin(hotel, "${role.name.lowercase()}-$suffix@test.local", role))
		}
		saveHotelAdmin(otherHotel, "other-master-$suffix@test.local", HotelAdminRole.MASTER)
	}

	@AfterEach
	fun deleteHotels() {
		executor.shutdownNow()
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
		assertThat(listOf(saved.name, saved.type, saved.description, saved.checkInTime, saved.checkOutTime, saved.version))
			.containsExactly("101", "스탠다드", null, LocalTime.of(14, 30), LocalTime.of(11, 0), 0L)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 자기 호텔의 객실을 조회하면 시각은 HH 콜론 mm 문자열로, 수정에 쓸 version과 함께 200으로 응답한다`(role: HotelAdminRole) {
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
	}

	@Test
	fun `없는 id와 다른 호텔의 객실 id로 조회하면 모두 404 ROOM_NOT_FOUND로 응답한다`() {
		val otherRoom = saveRoom(otherHotel, NAME)

		listOf(MISSING_ID, checkNotNull(otherRoom.id)).forEach { id ->
			HotelAdminRole.entries.forEach { role -> getRoom(id, principals.getValue(role)).andExpectError(RoomErrorCode.ROOM_NOT_FOUND) }
		}
	}

	@Test
	fun `로그인하지 않으면 객실 API는 401 UNAUTHORIZED로 응답하고 등록하지 않는다`() {
		val room = saveRoom(hotel, NAME)

		mockMvc.get("$ROOMS/${room.id}").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.post(ROOMS) { withCsrf(); jsonBody(createBody("name" to "102")) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		assertThat(roomNames(hotel)).containsExactly(NAME)
	}

	@Test
	fun `전체 어드민 역할로는 객실 API를 쓸 수 없어 403 FORBIDDEN으로 응답하고 등록하지 않는다`() {
		val room = saveRoom(hotel, NAME)
		val appAdmin = User.withUsername(USERNAME).password(PASSWORD_HASH).roles(Role.APP_ADMIN.name).build()

		getRoom(checkNotNull(room.id), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		create(createBody("name" to "102"), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		assertThat(roomNames(hotel)).containsExactly(NAME)
	}

	@Test
	fun `CSRF 토큰 없이 등록하면 403 INVALID_CSRF_TOKEN으로 응답하고 등록하지 않는다`() {
		mockMvc.post(ROOMS) { with(user(masterPrincipal)); jsonBody(createBody()) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)

		assertThat(roomNames(hotel)).isEmpty()
	}

	@Test
	fun `객실 API 문서는 room 태그에 operation마다 낼 수 있는 객실 에러를 예시로 보여준다`() {
		val docs = apiDocs()
		val rooms = docs["paths"][ROOMS]
		val room = docs["paths"]["$ROOMS/{roomId}"]
		val operations = listOf(rooms["post"], room["get"])

		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("createRoom", "getRoom")
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
		assertThat(room["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "500")
		assertThat(errorCodes(room["get"], HttpStatus.NOT_FOUND)).containsExactly(RoomErrorCode.ROOM_NOT_FOUND.code)
		assertThat(room["get"]["parameters"].values().map { it["name"].stringValue() }).containsExactly("roomId")
	}

	@Test
	fun `객실 요청 문서는 필수 항목과 문자열 길이, 정수 범위, 시각 형식을 보여주고 층과 소개는 선택이다`() {
		val request = apiDocs()["components"]["schemas"]["RoomCreateHotelAdminRequest"]

		assertThat(required(request)).containsExactlyInAnyOrder("name", "type", "capacity", "checkInTime", "checkOutTime")
		assertRequestRules(request)
	}

	@Test
	fun `객실 응답 문서는 모든 필드가 필수이고 층과 소개는 null을 허용하며 시각 형식을 보여준다`() {
		val response = apiDocs()["components"]["schemas"]["RoomHotelAdminResponse"]
		val properties = response["properties"]

		assertThat(required(response))
			.containsExactlyInAnyOrder("id", "name", "type", "capacity", "floor", "description", "checkInTime", "checkOutTime", "version")
		assertThat(properties.properties().filter { (_, property) -> "null" in types(property) }.map { it.key })
			.containsExactlyInAnyOrder("floor", "description")
		listOf("checkInTime", "checkOutTime").forEach { field ->
			assertThat(types(properties[field])).containsExactly("string")
			assertThat(properties[field]["pattern"].stringValue()).isEqualTo(JacksonConfig.LOCAL_TIME_PATTERN)
		}
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

	private fun getRoom(id: Long, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get("$ROOMS/$id") { with(user(principal)) }

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

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, PASSWORD_HASH, "계정", role))

	private fun saveRoom(
		hotel: Hotel,
		name: String,
		description: String? = null,
		checkInTime: LocalTime = LocalTime.of(15, 0),
		checkOutTime: LocalTime = LocalTime.of(11, 0),
	): Room = roomRepository.save(Room(hotel, name, ROOM_TYPE, CAPACITY, FLOOR, description, checkInTime, checkOutTime))

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
					"version" to version,
				),
			),
		)

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

	private fun schemaRef(name: String): JsonNode = json("""{"${'$'}ref":"#/components/schemas/$name"}""")

	private fun json(response: MockHttpServletResponse): JsonNode = json(response.getContentAsString(StandardCharsets.UTF_8))

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private fun maxLength(max: Int): String = message(MAX_LENGTH).replace("{max}", max.toString())

	companion object {
		private const val ROOMS = ApiPaths.HOTEL_ADMIN + "/rooms"
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val USERNAME = "tester"
		private const val NAME = "101"
		private const val ROOM_TYPE = "스탠다드"
		private const val CAPACITY = 2
		private const val FLOOR = 1
		private const val DESCRIPTION = "창이 큰 객실"
		private const val CHECK_IN = "15:00"
		private const val CHECK_OUT = "11:00"
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
		private const val DELETE_ROOMS = "delete from room where hotel_id = ?"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
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
	}
}
