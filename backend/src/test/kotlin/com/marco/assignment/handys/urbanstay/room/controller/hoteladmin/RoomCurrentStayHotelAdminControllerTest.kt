package com.marco.assignment.handys.urbanstay.room.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration
import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.TODAY
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
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
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import jakarta.persistence.EntityManagerFactory
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.hibernate.SessionFactory
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
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.put
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.nio.charset.StandardCharsets
import java.time.LocalTime
import java.util.Locale
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class, FixedClockConfiguration::class)
class RoomCurrentStayHotelAdminControllerTest {

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
	private lateinit var entityManagerFactory: EntityManagerFactory

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

	private lateinit var guest: Guest

	private lateinit var otherGuest: Guest

	private lateinit var master: HotelAdmin

	private lateinit var masterPrincipal: UserDetails

	@BeforeEach
	fun createHotel() {
		hotel = saveHotel("어반스테이 $suffix")
		guest = guestRepository.save(Guest(hotel, "홍길동", "010-1234-5678", "guest@example.com"))
		otherGuest = guestRepository.save(Guest(hotel, "김철수", "010-8765-4321", "other@example.com"))
		master = hotelAdminRepository.save(HotelAdmin(hotel, "master-$suffix@test.local", PASSWORD_HASH, "계정", HotelAdminRole.MASTER))
		masterPrincipal = HotelAdminPrincipal.from(master)
	}

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@ParameterizedTest
	@CsvSource("-1, 1", "0, 1")
	fun `객실 조회는 오늘(한국 시간)이 기간 안에 있는 취소하지 않은 이용을 이용객과 함께 지금 이용으로 보여준다`(checkInOffset: Long, checkOutOffset: Long) {
		val room = saveRoom(hotel, "101")
		val stay = saveStay(room, guest, checkInOffset, checkOutOffset)

		val data = getRoom(room).andExpectSuccess(HttpStatus.OK)

		assertThat(data["currentStay"]).isEqualTo(currentStayJson(stay, guest))
	}

	@ParameterizedTest
	@CsvSource("-2, 0, false", "1, 3, false", "-1, 1, true")
	fun `체크아웃 날짜가 오늘인 이용, 체크인 날짜가 내일 이후인 이용, 취소한 이용은 지금 이용이 아니어서 null이다`(
		checkInOffset: Long,
		checkOutOffset: Long,
		canceled: Boolean,
	) {
		val room = saveRoom(hotel, "101")
		val stay = saveStay(room, guest, checkInOffset, checkOutOffset)
		if (canceled) {
			cancel(stay)
		}

		assertThat(getRoom(room).andExpectSuccess(HttpStatus.OK)["currentStay"].isNull).isTrue()
	}

	@Test
	fun `목록은 객실마다 자기 지금 이용만 보여주고 객실 조회 한 번과 이용 조회 한 번으로, 객실이나 이용객을 하나씩 더 읽지 않고 응답한다`() {
		val staying = saveRoom(hotel, "101")
		val checkedInToday = saveRoom(hotel, "102")
		val checkingOutToday = saveRoom(hotel, "103")
		val arrivingTomorrow = saveRoom(hotel, "104")
		saveRoom(hotel, "105")
		val stayingStay = saveStay(staying, guest, -1, 2)
		cancel(saveStay(checkedInToday, guest, -1, 1))
		val checkedInTodayStay = saveStay(checkedInToday, otherGuest, 0, 2)
		saveStay(checkingOutToday, otherGuest, -2, 0)
		saveStay(arrivingTomorrow, guest, 1, 3)
		val otherHotel = saveHotel("다른 호텔 $suffix")
		val otherHotelGuest = guestRepository.save(Guest(otherHotel, "홍길동", "010-1234-5678", "guest@example.com"))
		saveStay(saveRoom(otherHotel, "101"), otherHotelGuest, -1, 1)

		val (data, queryCount) = countingQueries { getRooms().andExpectSuccess(HttpStatus.OK) }

		val currentStays = data["items"].values().associate { it["name"].stringValue() to it["currentStay"] }
		assertThat(currentStays.keys).containsExactly("101", "102", "103", "104", "105")
		assertThat(currentStays.getValue("101")).isEqualTo(currentStayJson(stayingStay, guest))
		assertThat(currentStays.getValue("102")).isEqualTo(currentStayJson(checkedInTodayStay, otherGuest))
		assertThat(listOf("103", "104", "105").map { currentStays.getValue(it).isNull }).containsOnly(true)
		assertThat(queryCount).isEqualTo(QueryCount(queries = 2, lazyFetches = 0))
	}

	@Test
	fun `수정과 상태 변경 응답에도 지금 이용이 담긴다`() {
		val room = saveRoom(hotel, "101")
		val stay = saveStay(room, guest, -1, 1)
		val expected = currentStayJson(stay, guest)

		val updated = put("$ROOMS/${room.id}", mapOf("name" to "101", "roomTypeId" to roomType(hotel).id, "version" to room.version)).andExpectSuccess(HttpStatus.OK)
		val statusChanged = put("$ROOMS/${room.id}/status", mapOf("from" to RoomStatus.VACANT.name, "to" to RoomStatus.RESERVED.name))
			.andExpectSuccess(HttpStatus.OK)

		assertThat(listOf(updated["currentStay"], statusChanged["currentStay"])).containsOnly(expected)
	}

	@Test
	fun `객실 응답 문서는 지금 이용을 null을 허용하는 필수 필드로, 지금 이용과 이용객의 모든 필드를 필수로 보여준다`() {
		val schemas = apiDocs()["components"]["schemas"]
		val room = schemas["RoomHotelAdminResponse"]
		val currentStay = schemas["RoomCurrentStayHotelAdminResponse"]
		val guest = schemas["RoomCurrentStayGuestHotelAdminResponse"]

		assertThat(required(room)).contains("currentStay")
		assertThat(room["properties"]["currentStay"]["oneOf"].values().map { it["type"]?.stringValue() ?: it[REF].stringValue() })
			.containsExactlyInAnyOrder("null", "#/components/schemas/RoomCurrentStayHotelAdminResponse")
		assertThat(room["properties"]["currentStay"]["description"].stringValue()).isEqualTo(message("openapi.schema.RoomHotelAdminResponse.currentStay"))
		assertThat(required(currentStay)).containsExactlyInAnyOrder("id", "checkInDate", "checkOutDate", "guest")
		assertThat(required(guest)).containsExactlyInAnyOrder("id", "name", "phone")
		listOf("id", "checkInDate", "checkOutDate", "guest").forEach { field ->
			assertThat(currentStay["properties"][field]["description"].stringValue())
				.isEqualTo(message("openapi.schema.RoomCurrentStayHotelAdminResponse.$field"))
		}
		assertThat(listOf("checkInDate", "checkOutDate").map { currentStay["properties"][it]["format"].stringValue() }).containsOnly("date")
		assertThat(guest["properties"]["phone"]["example"].stringValue()).isEqualTo("010-1234-5678")
	}

	private fun <T> countingQueries(request: () -> T): Pair<T, QueryCount> {
		val statistics = entityManagerFactory.unwrap(SessionFactory::class.java).statistics
		statistics.clear()
		statistics.isStatisticsEnabled = true
		try {
			val result = request()
			return result to QueryCount(statistics.queryExecutionCount, statistics.entityFetchCount)
		} finally {
			statistics.isStatisticsEnabled = false
		}
	}

	private fun getRooms(): ResultActionsDsl = mockMvc.get(ROOMS) { with(user(masterPrincipal)) }

	private fun getRoom(room: Room): ResultActionsDsl = mockMvc.get("$ROOMS/${room.id}") { with(user(masterPrincipal)) }

	private fun put(path: String, body: Map<String, Any?>): ResultActionsDsl =
		mockMvc.put(path) {
			with(user(masterPrincipal))
			withCsrf()
			contentType = MediaType.APPLICATION_JSON
			content = jsonMapper.writeValueAsString(body)
		}

	private fun MockHttpServletRequestDsl.withCsrf() {
		cookie(xsrf)
		header(XSRF_HEADER, xsrf.value)
	}

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveRoom(hotel: Hotel, name: String): Room =
		roomRepository.save(Room(hotel, name, roomType(hotel), null, null))

	private fun roomType(hotel: Hotel): RoomType =
		roomTypes.getOrPut(checkNotNull(hotel.id)) {
			roomTypeRepository.save(RoomType(hotel, "스탠다드", CAPACITY, 100000, LocalTime.of(15, 0), LocalTime.of(11, 0)))
		}

	private fun saveStay(room: Room, guest: Guest, checkInOffset: Long, checkOutOffset: Long): Stay =
		stayRepository.save(Stay(room, guest, TODAY.plusDays(checkInOffset), TODAY.plusDays(checkOutOffset), 2, 100000))

	private fun cancel(stay: Stay) {
		jdbcTemplate.update(CANCEL_STAY, master.id, stay.id)
	}

	private fun currentStayJson(stay: Stay, guest: Guest): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to stay.id,
					"checkInDate" to stay.checkInDate.toString(),
					"checkOutDate" to stay.checkOutDate.toString(),
					"guest" to linkedMapOf("id" to guest.id, "name" to guest.name, "phone" to guest.phone),
				),
			),
		)

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(status.value())
		assertThat(body["success"].booleanValue()).isTrue()
		return body["data"]
	}

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

	private fun required(schema: JsonNode): List<String> = schema.path("required").values().map { it.stringValue() }

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private data class QueryCount(val queries: Long, val lazyFetches: Long)

	companion object {
		private const val ROOMS = ApiPaths.HOTEL_ADMIN + "/rooms"
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val CAPACITY = 4
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val REF = "\$ref"
		private const val CANCEL_STAY = "update stay set canceled_at = now(), canceled_by_id = ?, canceled_by_name = '계정' where id = ?"
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
