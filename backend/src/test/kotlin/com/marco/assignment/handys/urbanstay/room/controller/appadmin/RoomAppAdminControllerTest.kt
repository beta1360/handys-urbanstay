package com.marco.assignment.handys.urbanstay.room.controller.appadmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.nio.charset.StandardCharsets
import java.time.LocalTime
import java.util.Locale
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class RoomAppAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var roomRepository: RoomRepository

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

	private lateinit var hotel: Hotel

	@BeforeEach
	fun createHotel() {
		hotel = saveHotel("어반스테이 $suffix")
	}

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `호텔의 객실만 이름 속 숫자를 숫자 크기로 비교한 이름순으로 id, 이름, 유형, 층, 상태를 담아 페이지로 조회한다`() {
		val standard = saveRoomType(hotel, "스탠다드")
		val deluxe = saveRoomType(hotel, "디럭스")
		val b101 = saveRoom(hotel, "B동 101", deluxe, null)
		val r1001 = saveRoom(hotel, "1001", deluxe, 10)
		val r99 = saveRoom(hotel, "99", standard, -1)
		val r101 = saveRoom(hotel, "101", standard, 1)
		jdbcTemplate.update(UPDATE_ROOM_STATUS, RoomStatus.MAINTENANCE.name, r101.id)
		val otherHotel = saveHotel("다른 호텔 $suffix")
		saveRoom(otherHotel, "100", saveRoomType(otherHotel, "스탠다드"), 1)

		val all = getHotelRooms(checkNotNull(hotel.id)).andExpectSuccess()
		val second = getHotelRooms(hotel.id!!, "page" to "1", "size" to "2").andExpectSuccess()

		assertThat(all["items"]).isEqualTo(
			json(
				listOf(
					roomJson(r99, -1, RoomStatus.VACANT),
					roomJson(r101, 1, RoomStatus.MAINTENANCE),
					roomJson(r1001, 10, RoomStatus.VACANT),
					roomJson(b101, null, RoomStatus.VACANT),
				),
			),
		)
		assertThat(pageInfo(all)).containsExactly(0, 10, 4, 1)
		assertThat(second["items"].values().map { it["id"].longValue() }).containsExactly(r1001.id, b101.id)
		assertThat(pageInfo(second)).containsExactly(1, 2, 4, 2)
	}

	@Test
	fun `객실이 없는 호텔은 빈 목록이고 없는 호텔은 404 HOTEL_NOT_FOUND로 응답한다`() {
		assertThat(pageInfo(getHotelRooms(checkNotNull(hotel.id)).andExpectSuccess())).containsExactly(0, 10, 0, 0)

		getHotelRooms(MISSING_ID).andExpectError(HotelErrorCode.HOTEL_NOT_FOUND)
	}

	@Test
	fun `로그인하지 않으면 401, 호텔 계정 역할이면 403으로 응답한다`() {
		mockMvc.get("$HOTELS/${hotel.id}/rooms").andExpectError(CommonErrorCode.UNAUTHORIZED)
		getHotelRooms(checkNotNull(hotel.id), role = Role.HOTEL_ADMIN).andExpectError(CommonErrorCode.FORBIDDEN)
	}

	@Test
	fun `API 문서는 room 태그에 page·size와 404 HOTEL_NOT_FOUND, 모든 필드가 필수인 객실 응답을 보여준다`() {
		val docs = json(mockMvc.get(APP_ADMIN_DOCS).andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val operation = docs["paths"]["$HOTELS/{hotelId}/rooms"]["get"]
		val schema = docs["components"]["schemas"]["RoomAppAdminResponse"]

		assertThat(operation["operationId"].stringValue()).isEqualTo("getHotelRooms")
		assertThat(operation["tags"].values().map { it.stringValue() }).containsExactly("room")
		assertThat(operation["parameters"].values().map { it["name"].stringValue() }).containsExactly("hotelId", "page", "size")
		assertThat(operation["responses"]["404"]["content"][JSON]["example"]["error"]["code"].stringValue()).isEqualTo(HotelErrorCode.HOTEL_NOT_FOUND.code)
		assertThat(schema["required"].values().map { it.stringValue() }).containsExactlyInAnyOrder("id", "name", "roomType", "floor", "status")
		assertThat(schema["properties"]["roomType"][REF].stringValue()).isEqualTo("#/components/schemas/RoomRoomTypeAppAdminResponse")
		assertThat(docs["components"]["schemas"]["RoomRoomTypeAppAdminResponse"]["required"].values().map { it.stringValue() })
			.containsExactlyInAnyOrder("id", "name")
		assertThat(docs["tags"].values().single { it["name"].stringValue() == "room" }["description"].stringValue())
			.isEqualTo(message("openapi.app-admin.tag.room"))
	}

	private fun getHotelRooms(hotelId: Long, vararg params: Pair<String, String>, role: Role = Role.APP_ADMIN): ResultActionsDsl =
		mockMvc.get("$HOTELS/$hotelId/rooms") {
			with(user("tester").roles(role.name))
			params.forEach { (name, value) -> param(name, value) }
		}

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", "02-1234-5678", null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveRoomType(hotel: Hotel, name: String): RoomType =
		roomTypeRepository.save(RoomType(hotel, name, 2, 100000, LocalTime.of(15, 0), LocalTime.of(11, 0)))

	private fun saveRoom(hotel: Hotel, name: String, roomType: RoomType, floor: Int?): Room = roomRepository.save(Room(hotel, name, roomType, floor, "소개"))

	private fun roomJson(room: Room, floor: Int?, status: RoomStatus): Map<String, Any?> =
		linkedMapOf(
			"id" to room.id,
			"name" to room.name,
			"roomType" to linkedMapOf("id" to room.roomType.id, "name" to room.roomType.name),
			"floor" to floor,
			"status" to status.name,
		)

	private fun ResultActionsDsl.andExpectSuccess(): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(HttpStatus.OK.value())
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].isNull).isTrue()
		return body["data"]
	}

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode) {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(errorCode.status.value())
		assertThat(body["error"]["code"].stringValue()).isEqualTo(errorCode.code)
		assertThat(body["error"]["message"].stringValue()).isEqualTo(message(errorCode.messageKey))
	}

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

	private fun json(value: Any): JsonNode = jsonMapper.readTree(jsonMapper.writeValueAsString(value))

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	companion object {
		private const val HOTELS = ApiPaths.APP_ADMIN + "/hotels"
		private const val APP_ADMIN_DOCS = "/v3/api-docs/app-admin"
		private const val JSON = "application/json"
		private const val REF = "\$ref"
		private const val MISSING_ID = Long.MAX_VALUE
		private val DELETE_BY_HOTEL = listOf("delete from room where hotel_id = ?", "delete from room_type where hotel_id = ?")
		private const val UPDATE_ROOM_STATUS = "update room set status = ? where id = ?"
	}
}
