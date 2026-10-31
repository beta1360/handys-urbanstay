package com.marco.assignment.handys.urbanstay.hotel.controller.app

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
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
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class HotelAppControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var roomTypeRepository: RoomTypeRepository

	@Autowired
	private lateinit var roomRepository: RoomRepository

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	private val suffix = UUID.randomUUID().toString().take(8)

	private val createdHotelIds = mutableListOf<Long>()

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `로그인 없이 모든 호텔을 이름 오름차순, 같으면 id 오름차순으로 id·이름·주소·객실 수만 조회한다`() {
		val b = saveHotel("어반스테이 B $suffix", "서울 1", roomCount = 1)
		val firstA = saveHotel("어반스테이 A $suffix", "서울 2", roomCount = 2)
		val secondA = saveHotel("어반스테이 A $suffix", "서울 3", roomCount = 1)

		val data = getHotels("size" to "100").andExpectSuccess()
		val mine = mine(data["items"].values())

		assertThat(mine.map { it["id"].longValue() }).containsExactly(firstA.id, secondA.id, b.id)
		assertThat(mine[0]).isEqualTo(
			json(jsonMapper.writeValueAsString(linkedMapOf("id" to firstA.id, "name" to firstA.name, "address" to firstA.address, "roomCount" to 2))),
		)
		assertThat(listOf(data["page"].intValue(), data["size"].intValue())).containsExactly(0, 100)
	}

	@Test
	fun `객실이 있는 호텔이 이름과 관계없이 먼저 오고 객실이 없는 호텔이 뒤에 오며, 페이지를 나눠도 같은 순서다`() {
		val z = saveHotel("어반스테이 Z $suffix", "서울 1", roomCount = 2)
		val firstEmpty = saveHotel("어반스테이 A $suffix", "서울 2", roomCount = 0)
		val firstB = saveHotel("어반스테이 B $suffix", "서울 3", roomCount = 1)
		val secondB = saveHotel("어반스테이 B $suffix", "서울 4", roomCount = 1)
		val secondEmpty = saveHotel("어반스테이 A $suffix", "서울 5", roomCount = 0)

		val total = getHotels("size" to "100").andExpectSuccess()["totalElements"].intValue()
		val size = maxOf(2, (total + MAX_PAGES - 1) / MAX_PAGES)
		val first = getHotels("page" to "0", "size" to size.toString()).andExpectSuccess()
		val all = (0 until first["totalPages"].intValue()).flatMap { page ->
			getHotels("page" to page.toString(), "size" to size.toString()).andExpectSuccess()["items"].values()
		}

		assertThat(all.map { it["id"].longValue() }).doesNotHaveDuplicates().hasSize(total)
		assertThat(all.map { it["roomCount"].intValue() }.dropWhile { it > 0 }).containsOnly(0)
		val mine = mine(all)
		assertThat(mine.map { it["id"].longValue() }).containsExactly(firstB.id, secondB.id, z.id, firstEmpty.id, secondEmpty.id)
		assertThat(mine.map { it["roomCount"].intValue() }).containsExactly(1, 1, 2, 0, 0)
	}

	@Test
	fun `호텔 목록 문서는 게스트 앱 그룹의 hotel 태그에 있고 401·403 에러가 없다`() {
		val docs = json(mockMvc.get(APP_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val operation = docs["paths"][HOTELS]["get"]

		assertThat(operation["operationId"].stringValue()).isEqualTo("getHotels")
		assertThat(operation["tags"].values().map { it.stringValue() }).containsExactly("hotel")
		assertThat(operation["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "500")
		assertThat(operation["parameters"].values().map { it["name"].stringValue() }).containsExactly("page", "size")
		assertThat(docs["components"]["schemas"]["HotelAppResponse"]["properties"].propertyNames()).containsExactly("id", "name", "address", "roomCount")
	}

	private fun getHotels(vararg params: Pair<String, String>): ResultActionsDsl =
		mockMvc.get(HOTELS) { params.forEach { (name, value) -> param(name, value) } }

	private fun mine(items: Collection<JsonNode>): List<JsonNode> = items.filter { it["id"].longValue() in createdHotelIds }

	private fun saveHotel(name: String, address: String, roomCount: Int): Hotel {
		val hotel = hotelRepository.save(Hotel(name, "$address $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }
		if (roomCount > 0) {
			val roomType = roomTypeRepository.save(RoomType(hotel, "스탠다드", 2, 100000, LocalTime.of(15, 0), LocalTime.of(11, 0)))
			repeat(roomCount) { roomRepository.save(Room(hotel, "${101 + it}", roomType, null, null)) }
		}
		return hotel
	}

	private fun ResultActionsDsl.andExpectSuccess(): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(HttpStatus.OK.value())
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].isNull).isTrue()
		assertThat(response.cookies).isEmpty()
		return body["data"]
	}

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	companion object {
		private const val HOTELS = ApiPaths.APP + "/hotels"
		private const val APP_DOCS = "/v3/api-docs/app"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val MAX_PAGES = 100
		private val DELETE_BY_HOTEL = listOf("delete from room where hotel_id = ?", "delete from room_type where hotel_id = ?")
	}
}
