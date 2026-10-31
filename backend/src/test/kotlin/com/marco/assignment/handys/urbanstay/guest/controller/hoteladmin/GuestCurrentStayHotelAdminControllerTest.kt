package com.marco.assignment.handys.urbanstay.guest.controller.hoteladmin

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
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import jakarta.servlet.http.Cookie
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
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
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
class GuestCurrentStayHotelAdminControllerTest {

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

	private lateinit var master: HotelAdmin

	private lateinit var masterPrincipal: UserDetails

	@BeforeEach
	fun createHotel() {
		val hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", "02-1234-5678", null)).also { createdHotelIds += checkNotNull(it.id) }
		room = saveRoom(hotel, "101", saveRoomType(hotel, "스탠다드"))
		otherRoom = saveRoom(hotel, "102", saveRoomType(hotel, "디럭스"))
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
	fun `이용객 조회는 오늘(한국 시간)이 기간 안에 있는 취소하지 않은 이용을 객실과 함께 지금 이용으로 보여준다`(checkInOffset: Long, checkOutOffset: Long) {
		val stay = saveStay(room, guest, checkInOffset, checkOutOffset)

		val data = getGuest(guest).andExpectSuccess()

		assertThat(data["currentStay"]).isEqualTo(currentStayJson(stay, room))
	}

	@ParameterizedTest
	@CsvSource("-2, 0, false", "1, 3, false", "-1, 1, true")
	fun `체크아웃 날짜가 오늘인 이용, 체크인 날짜가 내일 이후인 이용, 취소한 이용은 지금 이용이 아니어서 null이다`(
		checkInOffset: Long,
		checkOutOffset: Long,
		canceled: Boolean,
	) {
		val stay = saveStay(room, guest, checkInOffset, checkOutOffset)
		if (canceled) {
			cancel(stay)
		}

		assertThat(getGuest(guest).andExpectSuccess()["currentStay"].isNull).isTrue()
	}

	@Test
	fun `여러 객실을 함께 이용 중이면 취소하지 않은 이용 중 체크인 날짜가 이른 하나를 보여주고 다른 이용객의 이용은 보지 않는다`() {
		cancel(saveStay(room, guest, -5, 1))
		saveStay(room, guest, -1, 2)
		val earliest = saveStay(otherRoom, guest, -3, 1)
		saveStay(otherRoom, otherGuest, 1, 3)

		assertThat(getGuest(guest).andExpectSuccess()["currentStay"]).isEqualTo(currentStayJson(earliest, otherRoom))
		assertThat(getGuest(otherGuest).andExpectSuccess()["currentStay"].isNull).isTrue()
	}

	@Test
	fun `수정 응답에도 지금 이용이 담긴다`() {
		val stay = saveStay(room, guest, -1, 1)
		val body = mapOf("name" to "홍길순", "phone" to guest.phone, "email" to guest.email, "version" to guest.version)

		val data = mockMvc.put("$GUESTS/${guest.id}") {
			with(user(masterPrincipal))
			cookie(xsrf)
			header(XSRF_HEADER, xsrf.value)
			contentType = MediaType.APPLICATION_JSON
			content = jsonMapper.writeValueAsString(body)
		}.andExpectSuccess()

		assertThat(data["name"].stringValue()).isEqualTo("홍길순")
		assertThat(data["currentStay"]).isEqualTo(currentStayJson(stay, room))
	}

	@Test
	fun `조회·수정 응답 문서는 지금 이용을 null을 허용하는 필수 필드로 보여주고 목록 항목에는 지금 이용이 없다`() {
		val docs = apiDocs()
		val schemas = docs["components"]["schemas"]
		val detail = schemas["GuestDetailHotelAdminResponse"]
		val guestPath = docs["paths"]["$GUESTS/{guestId}"]

		assertThat(listOf(guestPath["get"], guestPath["put"]).map { it["responses"]["200"]["content"][JSON]["schema"][REF].stringValue() })
			.containsOnly("#/components/schemas/ApiResponseGuestDetailHotelAdminResponse")
		assertThat(required(detail)).containsExactlyInAnyOrder("id", "name", "phone", "email", "currentStay", "version")
		assertThat(detail["properties"]["currentStay"]["oneOf"].values().map { it["type"]?.stringValue() ?: it[REF].stringValue() })
			.containsExactlyInAnyOrder("null", "#/components/schemas/GuestCurrentStayHotelAdminResponse")
		assertThat(required(schemas["GuestCurrentStayHotelAdminResponse"])).containsExactlyInAnyOrder("id", "room", "checkInDate", "checkOutDate")
		assertThat(required(schemas["GuestCurrentStayRoomHotelAdminResponse"])).containsExactlyInAnyOrder("id", "name", "roomType")
		assertThat(required(schemas["GuestCurrentStayRoomTypeHotelAdminResponse"])).containsExactlyInAnyOrder("id", "name")
		assertThat(schemas["GuestHotelAdminResponse"]["properties"].propertyNames()).doesNotContain("currentStay")
		assertThat(detail["properties"]["currentStay"]["description"].stringValue())
			.isEqualTo(message("openapi.schema.GuestDetailHotelAdminResponse.currentStay"))
	}

	private fun getGuest(guest: Guest): ResultActionsDsl = mockMvc.get("$GUESTS/${guest.id}") { with(user(masterPrincipal)) }

	private fun saveRoomType(hotel: Hotel, name: String): RoomType =
		roomTypeRepository.save(RoomType(hotel, name, 4, ROOM_RATE, LocalTime.of(15, 0), LocalTime.of(11, 0)))

	private fun saveRoom(hotel: Hotel, name: String, roomType: RoomType): Room = roomRepository.save(Room(hotel, name, roomType, null, null))

	private fun saveStay(room: Room, guest: Guest, checkInOffset: Long, checkOutOffset: Long): Stay =
		stayRepository.save(Stay(room, guest, TODAY.plusDays(checkInOffset), TODAY.plusDays(checkOutOffset), 2, ROOM_RATE))

	private fun cancel(stay: Stay) {
		jdbcTemplate.update(CANCEL_STAY, master.id, stay.id)
	}

	private fun currentStayJson(stay: Stay, room: Room): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to stay.id,
					"room" to linkedMapOf(
						"id" to room.id,
						"name" to room.name,
						"roomType" to linkedMapOf("id" to room.roomType.id, "name" to room.roomType.name),
					),
					"checkInDate" to stay.checkInDate.toString(),
					"checkOutDate" to stay.checkOutDate.toString(),
				),
			),
		)

	private fun ResultActionsDsl.andExpectSuccess(): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(HttpStatus.OK.value())
		assertThat(body["success"].booleanValue()).isTrue()
		return body["data"]
	}

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

	private fun required(schema: JsonNode): List<String> = schema.path("required").values().map { it.stringValue() }

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	companion object {
		private const val GUESTS = ApiPaths.HOTEL_ADMIN + "/guests"
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val PASSWORD_HASH = "password-hash"
		private const val ROOM_RATE = 100000
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val JSON = "application/json"
		private const val REF = "\$ref"
		private const val CANCEL_STAY = "update stay set canceled_at = now(), canceled_by_id = ?, canceled_by_name = '계정' where id = ?"
		private val DELETE_BY_HOTEL = listOf(
			"delete from stay where room_id in (select id from room where hotel_id = ?)",
			"delete from guest where hotel_id = ?",
			"delete from room where hotel_id = ?",
			"delete from room_type where hotel_id = ?",
			"delete from hotel_admin where hotel_id = ?",
		)
	}
}
