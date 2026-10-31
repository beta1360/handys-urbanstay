package com.marco.assignment.handys.urbanstay.room.controller.app

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomStatus
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
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
class RoomAppControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var roomRepository: RoomRepository

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	private val suffix = UUID.randomUUID().toString().take(8)

	private lateinit var hotel: Hotel

	private lateinit var otherHotel: Hotel

	@BeforeEach
	fun createHotels() {
		hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", HOTEL_PHONE, null))
		otherHotel = hotelRepository.save(Hotel("다른 호텔 $suffix", "서울 $suffix", HOTEL_PHONE, null))
	}

	@AfterEach
	fun deleteHotels() {
		listOf(hotel, otherHotel).forEach { jdbcTemplate.update(DELETE_ROOMS, it.id) }
		hotelRepository.deleteAllByIdInBatch(listOf(checkNotNull(hotel.id), checkNotNull(otherHotel.id)))
	}

	@Test
	fun `로그인 없이 호텔의 객실을 상태와 관계없이 이름 오름차순(숫자 크기)으로 조회하고 다른 호텔 객실은 빼며 page와 size로 나눈다`() {
		val rooms = listOf("1001", "B동 101", "99", "101", "B동 99").associateWith { saveRoom(hotel, it) }
		saveRoom(otherHotel, "100")
		jdbcTemplate.update(UPDATE_ROOM_STATUS, RoomStatus.MAINTENANCE.name, rooms.getValue("101").id)

		val data = getRooms(checkNotNull(hotel.id)).andExpectSuccess()

		assertThat(data["items"].values().map { it["name"].stringValue() }).containsExactly("99", "101", "1001", "B동 99", "B동 101")
		assertThat(data["items"][0]).isEqualTo(
			json(
				jsonMapper.writeValueAsString(
					linkedMapOf(
						"id" to rooms.getValue("99").id,
						"name" to "99",
						"type" to "스탠다드",
						"capacity" to 4,
						"checkInTime" to "15:00",
						"checkOutTime" to "11:00",
					),
				),
			),
		)
		val second = getRooms(hotel.id!!, "page" to "1", "size" to "2").andExpectSuccess()
		assertThat(second["items"].values().map { it["name"].stringValue() }).containsExactly("1001", "B동 99")
		assertThat(listOf("page", "size", "totalElements", "totalPages").map { second[it].longValue() }).containsExactly(1, 2, 5, 3)
	}

	@Test
	fun `없는 호텔의 객실 목록은 404 HOTEL_NOT_FOUND로 응답한다`() {
		val response = getRooms(MISSING_ID).andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))

		assertThat(response.status).isEqualTo(HttpStatus.NOT_FOUND.value())
		assertThat(body["error"]["code"].stringValue()).isEqualTo(HotelErrorCode.HOTEL_NOT_FOUND.code)
		assertThat(body["error"]["message"].stringValue()).isEqualTo(messageSource.getMessage(HotelErrorCode.HOTEL_NOT_FOUND.messageKey, null, Locale.KOREAN))
	}

	@Test
	fun `객실 목록 문서는 게스트 앱 그룹의 room 태그에 HOTEL_NOT_FOUND 예시와 함께 있다`() {
		val docs = json(mockMvc.get(APP_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val operation = docs["paths"]["${ApiPaths.APP}/hotels/{hotelId}/rooms"]["get"]
		val notFound = operation["responses"]["404"]["content"][JSON]

		assertThat(operation["operationId"].stringValue()).isEqualTo("getHotelRooms")
		assertThat(operation["tags"].values().map { it.stringValue() }).containsExactly("room")
		assertThat(operation["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "404", "500")
		assertThat((notFound["example"] ?: notFound["examples"].values().single()["value"])["error"]["code"].stringValue())
			.isEqualTo(HotelErrorCode.HOTEL_NOT_FOUND.code)
		assertThat(docs["components"]["schemas"]["RoomAppResponse"]["properties"].propertyNames())
			.containsExactly("id", "name", "type", "capacity", "checkInTime", "checkOutTime")
	}

	private fun getRooms(hotelId: Long, vararg params: Pair<String, String>): ResultActionsDsl =
		mockMvc.get("${ApiPaths.APP}/hotels/$hotelId/rooms") { params.forEach { (name, value) -> param(name, value) } }

	private fun saveRoom(hotel: Hotel, name: String): Room =
		roomRepository.save(Room(hotel, name, "스탠다드", 4, 3, "소개", LocalTime.of(15, 0), LocalTime.of(11, 0)))

	private fun ResultActionsDsl.andExpectSuccess(): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(HttpStatus.OK.value())
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].isNull).isTrue()
		return body["data"]
	}

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	companion object {
		private const val APP_DOCS = "/v3/api-docs/app"
		private const val JSON = "application/json"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val DELETE_ROOMS = "delete from room where hotel_id = ?"
		private const val UPDATE_ROOM_STATUS = "update room set status = ? where id = ?"
	}
}
