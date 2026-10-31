package com.marco.assignment.handys.urbanstay.room.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
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
import java.nio.charset.StandardCharsets
import java.time.LocalTime
import java.util.Locale
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class RoomTypeHotelAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var roomTypeRepository: RoomTypeRepository

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)

	private val createdHotelIds = mutableListOf<Long>()

	private val xsrf: Cookie by lazy { checkNotNull(mockMvc.get(HOTEL_ADMIN_ME).andReturn().response.getCookie(XSRF_COOKIE)) }

	private lateinit var hotel: Hotel

	private lateinit var otherHotel: Hotel

	private lateinit var principals: Map<HotelAdminRole, UserDetails>

	private val master: UserDetails get() = principals.getValue(HotelAdminRole.MASTER)

	private val operator: UserDetails get() = principals.getValue(HotelAdminRole.OPERATOR)

	@BeforeEach
	fun createHotels() {
		hotel = saveHotel("어반스테이 $suffix")
		otherHotel = saveHotel("다른 호텔 $suffix")
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
	fun `마스터가 객실 유형을 생성하면 이름의 앞뒤 공백을 지워 저장하고 version 0으로 201 응답한다`() {
		val data = create(body("name" to " 스탠다드\t", "capacity" to 4, "roomRate" to 0, "checkInTime" to "00:00", "checkOutTime" to "23:59"))
			.andExpectSuccess(HttpStatus.CREATED, "success.room-type.created")

		val id = data["id"].longValue()
		assertThat(data).isEqualTo(roomTypeJson(id, "스탠다드", 4, 0, "00:00", "23:59", 0))
		val saved = roomTypeRepository.findById(id).orElseThrow()
		assertThat(listOf(saved.hotel.id, saved.name, saved.capacity, saved.roomRate)).containsExactly(hotel.id, "스탠다드", 4, 0)
	}

	@Test
	fun `운영자는 객실 유형을 생성하거나 수정할 수 없어 403 FORBIDDEN으로 응답하고 바꾸지 않는다`() {
		val roomType = saveRoomType(hotel, STANDARD)

		create(body("name" to "디럭스"), operator).andExpectError(CommonErrorCode.FORBIDDEN)
		update(checkNotNull(roomType.id), body("roomRate" to 1, "version" to 0), operator).andExpectError(CommonErrorCode.FORBIDDEN)

		assertThat(names(hotel)).containsExactly(STANDARD)
		assertThat(reload(roomType).roomRate).isEqualTo(ROOM_RATE)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 자기 호텔의 객실 유형을 페이지 없이 이름순(숫자 크기)으로 조회하고 하나씩도 조회한다`(role: HotelAdminRole) {
		listOf("스탠다드", "10인실", "Deluxe", "2인실", "deluxe").forEach { saveRoomType(hotel, it) }
		saveRoomType(otherHotel, "1인실")

		val list = getRoomTypes(principals.getValue(role)).andExpectSuccess(HttpStatus.OK, null)

		assertThat(list.values().map { it["name"].stringValue() }).containsExactly("2인실", "10인실", "deluxe", "Deluxe", "스탠다드")
		val first = list[0]
		val data = getRoomType(first["id"].longValue(), principals.getValue(role)).andExpectSuccess(HttpStatus.OK, null)
		assertThat(data).isEqualTo(first)
		assertThat(data).isEqualTo(roomTypeJson(first["id"].longValue(), "2인실", CAPACITY, ROOM_RATE, "15:00", "11:00", 0))
	}

	@Test
	fun `없는 id와 다른 호텔의 객실 유형 id로 조회하거나 수정하면 404 ROOM_TYPE_NOT_FOUND로 응답하고 바꾸지 않는다`() {
		val otherType = saveRoomType(otherHotel, STANDARD)

		listOf(MISSING_ID, checkNotNull(otherType.id)).forEach { id ->
			getRoomType(id, master).andExpectError(RoomErrorCode.ROOM_TYPE_NOT_FOUND)
			update(id, body("version" to 0)).andExpectError(RoomErrorCode.ROOM_TYPE_NOT_FOUND)
		}
		assertThat(reload(otherType).version).isZero()
	}

	@Test
	fun `마스터가 조회한 version으로 수정하면 모든 항목을 바꾸고 version을 올려 200으로 응답하며, version이 다르면 409 ROOM_TYPE_MODIFIED로 응답한다`() {
		val roomType = saveRoomType(hotel, STANDARD)
		val id = checkNotNull(roomType.id)

		val data = update(id, body("name" to " 디럭스 ", "capacity" to 20, "roomRate" to 10_000_000, "checkInTime" to "16:30", "checkOutTime" to "10:00", "version" to 0))
			.andExpectSuccess(HttpStatus.OK, "success.room-type.updated")

		assertThat(data).isEqualTo(roomTypeJson(id, "디럭스", 20, 10_000_000, "16:30", "10:00", 1))
		update(id, body("name" to "다시", "version" to 0)).andExpectError(RoomErrorCode.ROOM_TYPE_MODIFIED)
		assertThat(reload(roomType).name).isEqualTo("디럭스")
	}

	@Test
	fun `같은 호텔에 앞뒤 공백을 지운 이름이 같은 유형을 생성하거나 그 이름으로 수정하면 409 ROOM_TYPE_DUPLICATED이고 다른 호텔이나 대소문자만 다른 이름은 된다`() {
		saveRoomType(otherHotel, "Deluxe")
		val standard = saveRoomType(hotel, STANDARD)

		create(body("name" to " $STANDARD ")).andExpectError(RoomErrorCode.ROOM_TYPE_DUPLICATED)
		create(body("name" to "Deluxe")).andExpectSuccess(HttpStatus.CREATED, "success.room-type.created")
		create(body("name" to "deluxe")).andExpectSuccess(HttpStatus.CREATED, "success.room-type.created")
		update(checkNotNull(standard.id), body("name" to "Deluxe", "version" to 0)).andExpectError(RoomErrorCode.ROOM_TYPE_DUPLICATED)

		assertThat(names(hotel)).containsExactlyInAnyOrder(STANDARD, "Deluxe", "deluxe")
		assertThat(reload(standard).version).isZero()
	}

	@Test
	fun `이름, 최대 인원, 1박 요금, 체크인·체크아웃 시각이 규칙에 맞지 않으면 필드마다 오류 하나로 400 응답하고 생성하지 않는다`() {
		create(body("name" to " ", "capacity" to 0, "roomRate" to -1)).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"name" to message("validation.required"),
			"capacity" to message("validation.min").replace("{value}", "1"),
			"roomRate" to message("validation.min").replace("{value}", "0"),
		)
		create(body("checkInTime" to "15:00:00")).andExpectError(CommonErrorCode.INVALID_INPUT, "checkInTime" to message("validation.type"))
		create(body("name" to "가".repeat(RoomType.NAME_MAX_LENGTH + 1), "capacity" to 21, "roomRate" to 10_000_001)).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"name" to message("validation.max-length").replace("{max}", RoomType.NAME_MAX_LENGTH.toString()),
			"capacity" to message("validation.max").replace("{value}", "20"),
			"roomRate" to message("validation.max").replace("{value}", "10000000"),
		)
		create(body("checkOutTime" to "9:30")).andExpectError(CommonErrorCode.INVALID_INPUT, "checkOutTime" to message("validation.type"))
		create(body() - "roomRate").andExpectError(CommonErrorCode.INVALID_INPUT, "roomRate" to message("validation.required"))

		assertThat(names(hotel)).isEmpty()
	}

	private fun create(body: Map<String, Any?>, principal: UserDetails = master): ResultActionsDsl =
		mockMvc.post(ROOM_TYPES) {
			with(user(principal))
			withCsrf()
			jsonBody(body)
		}

	private fun update(id: Long, body: Map<String, Any?>, principal: UserDetails = master): ResultActionsDsl =
		mockMvc.put("$ROOM_TYPES/$id") {
			with(user(principal))
			withCsrf()
			jsonBody(body)
		}

	private fun getRoomTypes(principal: UserDetails): ResultActionsDsl = mockMvc.get(ROOM_TYPES) { with(user(principal)) }

	private fun getRoomType(id: Long, principal: UserDetails): ResultActionsDsl = mockMvc.get("$ROOM_TYPES/$id") { with(user(principal)) }

	private fun MockHttpServletRequestDsl.withCsrf() {
		cookie(xsrf)
		header(XSRF_HEADER, xsrf.value)
	}

	private fun MockHttpServletRequestDsl.jsonBody(body: Map<String, Any?>) {
		contentType = MediaType.APPLICATION_JSON
		content = jsonMapper.writeValueAsString(body)
	}

	private fun body(vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>(
			"name" to STANDARD,
			"capacity" to CAPACITY,
			"roomRate" to ROOM_RATE,
			"checkInTime" to "15:00",
			"checkOutTime" to "11:00",
		) + overrides

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, "password-hash", "계정", role))

	private fun saveRoomType(hotel: Hotel, name: String): RoomType =
		roomTypeRepository.save(RoomType(hotel, name, CAPACITY, ROOM_RATE, LocalTime.of(15, 0), LocalTime.of(11, 0)))

	private fun reload(roomType: RoomType): RoomType = roomTypeRepository.findById(checkNotNull(roomType.id)).orElseThrow()

	private fun names(hotel: Hotel): List<String> = jdbcTemplate.queryForList(SELECT_NAMES, String::class.java, hotel.id).filterNotNull()

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus, messageKey: String?): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(status.value())
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].stringValue(null)).isEqualTo(messageKey?.let(::message))
		return body["data"]
	}

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().map { it["field"].stringValue() to it["message"].stringValue() }

		assertThat(response.status).isEqualTo(errorCode.status.value())
		assertThat(body["error"]["code"].stringValue()).isEqualTo(errorCode.code)
		assertThat(actualFieldErrors).containsExactlyInAnyOrder(*fieldErrors)
	}

	private fun roomTypeJson(id: Long, name: String, capacity: Int, roomRate: Int, checkInTime: String, checkOutTime: String, version: Long): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to id,
					"name" to name,
					"capacity" to capacity,
					"roomRate" to roomRate,
					"checkInTime" to checkInTime,
					"checkOutTime" to checkOutTime,
					"version" to version,
				),
			),
		)

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	companion object {
		private const val ROOM_TYPES = ApiPaths.HOTEL_ADMIN + ApiPaths.ROOM_TYPES
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val PHONE = "02-1234-5678"
		private const val STANDARD = "스탠다드"
		private const val CAPACITY = 2
		private const val ROOM_RATE = 100000
		private const val MISSING_ID = Long.MAX_VALUE
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val SELECT_NAMES = "select name from room_type where hotel_id = ? order by id"
		private val DELETE_BY_HOTEL = listOf("delete from room_type where hotel_id = ?", "delete from hotel_admin where hotel_id = ?")
	}
}
