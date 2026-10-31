package com.marco.assignment.handys.urbanstay.hotel.controller.app

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.nio.charset.StandardCharsets
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
	private lateinit var jsonMapper: JsonMapper

	private val suffix = UUID.randomUUID().toString().take(8)

	private val createdHotelIds = mutableListOf<Long>()

	@AfterEach
	fun deleteHotels() {
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `로그인 없이 모든 호텔을 이름 오름차순, 같으면 id 오름차순으로 id·이름·주소만 조회한다`() {
		val b = saveHotel("어반스테이 B $suffix", "서울 1")
		val firstA = saveHotel("어반스테이 A $suffix", "서울 2")
		val secondA = saveHotel("어반스테이 A $suffix", "서울 3")

		val data = getHotels("size" to "100").andExpectSuccess()
		val mine = data["items"].values().filter { it["id"].longValue() in createdHotelIds }

		assertThat(mine.map { it["id"].longValue() }).containsExactly(firstA.id, secondA.id, b.id)
		assertThat(mine[0]).isEqualTo(json(jsonMapper.writeValueAsString(linkedMapOf("id" to firstA.id, "name" to firstA.name, "address" to firstA.address))))
		assertThat(listOf(data["page"].intValue(), data["size"].intValue())).containsExactly(0, 100)
	}

	@Test
	fun `호텔 목록 문서는 게스트 앱 그룹의 hotel 태그에 있고 401·403 에러가 없다`() {
		val docs = json(mockMvc.get(APP_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val operation = docs["paths"][HOTELS]["get"]

		assertThat(operation["operationId"].stringValue()).isEqualTo("getHotels")
		assertThat(operation["tags"].values().map { it.stringValue() }).containsExactly("hotel")
		assertThat(operation["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "500")
		assertThat(operation["parameters"].values().map { it["name"].stringValue() }).containsExactly("page", "size")
		assertThat(docs["components"]["schemas"]["HotelAppResponse"]["properties"].propertyNames()).containsExactly("id", "name", "address")
	}

	private fun getHotels(vararg params: Pair<String, String>): ResultActionsDsl =
		mockMvc.get(HOTELS) { params.forEach { (name, value) -> param(name, value) } }

	private fun saveHotel(name: String, address: String): Hotel =
		hotelRepository.save(Hotel(name, "$address $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

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
	}
}
