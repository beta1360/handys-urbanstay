package com.marco.assignment.handys.urbanstay.stay.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration
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
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import com.marco.assignment.handys.urbanstay.stay.dto.hoteladmin.StaySettlementHotelAdminResponse
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.node.ObjectNode
import java.nio.charset.StandardCharsets
import java.sql.Timestamp
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.Locale
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class, FixedClockConfiguration::class)
class StaySettlementHotelAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var roomTypeRepository: RoomTypeRepository

	@Autowired
	private lateinit var roomRepository: RoomRepository

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

	private lateinit var hotel: Hotel

	private lateinit var roomType: RoomType

	private lateinit var room: Room

	private lateinit var otherRoom: Room

	private lateinit var guest: Guest

	private lateinit var otherHotelRoom: Room

	private lateinit var otherHotelGuest: Guest

	private lateinit var master: HotelAdmin

	private lateinit var operator: HotelAdmin

	private val masterPrincipal: UserDetails get() = HotelAdminPrincipal.from(master)

	@BeforeEach
	fun createHotels() {
		hotel = saveHotel("어반스테이 $suffix")
		val otherHotel = saveHotel("다른 호텔 $suffix")
		roomType = saveRoomType(hotel)
		room = saveRoom(hotel, roomType, "101")
		otherRoom = saveRoom(hotel, roomType, "102")
		guest = saveGuest(hotel)
		otherHotelRoom = saveRoom(otherHotel, saveRoomType(otherHotel), "101")
		otherHotelGuest = saveGuest(otherHotel)
		master = saveHotelAdmin(hotel, HotelAdminRole.MASTER)
		operator = saveHotelAdmin(hotel, HotelAdminRole.OPERATOR)
	}

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `정산은 체크인 날짜가 그 달 1일부터 말일까지인 자기 호텔 이용만 넣고 취소하지 않은 이용의 금액 합계·건수와 취소 건수를 따로 준다`() {
		saveStay(room, LocalDate.of(2026, 10, 31), LocalDate.of(2026, 11, 2), 50000)
		saveStay(room, LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 4), 100000)
		saveStay(otherRoom, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 2), 70000)
		saveStay(room, LocalDate.of(2026, 11, 30), LocalDate.of(2026, 12, 1), 30000)
		cancel(saveStay(otherRoom, LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 16), 900000))
		saveStay(room, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 2), 80000)
		saveStay(otherHotelRoom, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 11), 60000, otherHotelGuest)

		assertThat(getSettlement("2026-11")).isEqualTo(settlementJson("2026-11", 200000 + 70000 + 30000, 3, 1))
		assertThat(getSettlement("2026-10")).isEqualTo(settlementJson("2026-10", 100000, 1, 0))
		assertThat(getSettlement("2026-12")).isEqualTo(settlementJson("2026-12", 80000, 1, 0))
		assertThat(getSettlement("2027-01")).isEqualTo(settlementJson("2027-01", 0, 0, 0))
	}

	@Test
	fun `정산 금액 합계는 정수 범위를 넘어도 그대로 준다`() {
		(1..8).forEach { saveStay(saveRoom(hotel, roomType, "20$it"), LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), MAX_ROOM_RATE) }

		assertThat(getSettlement("2026-11")).isEqualTo(settlementJson("2026-11", 8L * 30 * MAX_ROOM_RATE, 8, 0))
	}

	@Test
	fun `이용 로그는 그 달 체크인 이용을 취소한 이용까지 체크인 날짜 오름차순, 같으면 id 오름차순으로 페이지로 준다`() {
		saveStay(room, LocalDate.of(2026, 10, 31), LocalDate.of(2026, 11, 1), 10000)
		val last = saveStay(room, LocalDate.of(2026, 11, 30), LocalDate.of(2026, 12, 1), 10000)
		val firstDayFirst = saveStay(otherRoom, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 3), 10000)
		val firstDaySecond = saveStay(room, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 2), 10000)
		val canceled = saveStay(room, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12), 20000)
		val canceledAt = cancel(canceled)
		saveStay(room, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 2), 10000)
		saveStay(otherHotelRoom, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 11), 10000, otherHotelGuest)

		val all = getSettlementStays("month" to "2026-11")

		assertThat(itemIds(all)).containsExactly(firstDayFirst.id, firstDaySecond.id, canceled.id, last.id)
		assertThat(pageInfo(all)).containsExactly(0, 10, 4, 1)
		assertThat(all["items"][2]).isEqualTo(stayJson(canceled, canceledAt))
		assertThat(all["items"][0]["canceledAt"].isNull).isTrue()
		val second = getSettlementStays("month" to "2026-11", "page" to 1, "size" to 3)
		assertThat(itemIds(second)).containsExactly(last.id)
		assertThat(pageInfo(second)).containsExactly(1, 3, 4, 2)
	}

	@Test
	fun `운영자와 전체 어드민은 403, 로그인하지 않으면 401로 응답한다`() {
		val appAdmin = User.withUsername("tester").password(PASSWORD_HASH).roles(Role.APP_ADMIN.name).build()

		listOf(SETTLEMENTS, SETTLEMENT_STAYS).forEach { path ->
			mockMvc.get(path) { param("month", "2026-11") }.andExpectError(CommonErrorCode.UNAUTHORIZED)
			mockMvc.get(path) { with(user(HotelAdminPrincipal.from(operator))); param("month", "2026-11") }.andExpectError(CommonErrorCode.FORBIDDEN)
			mockMvc.get(path) { with(user(appAdmin)); param("month", "2026-11") }.andExpectError(CommonErrorCode.FORBIDDEN)
		}
	}

	@ParameterizedTest
	@ValueSource(strings = ["2026-13", "2026-00", "2026-1", "2026-11-01", "202611", " 2026-11", "abc"])
	fun `month 형식이 틀리면 400 INVALID_INPUT으로 응답하고 fieldErrors에 month를 담는다`(month: String) {
		listOf(SETTLEMENTS, SETTLEMENT_STAYS).forEach { path ->
			mockMvc.get(path) { with(user(masterPrincipal)); param("month", month) }
				.andExpectError(CommonErrorCode.INVALID_INPUT, "month" to message("validation.type"))
		}
	}

	@Test
	fun `month가 없으면 400 INVALID_INPUT으로 응답하고 fieldErrors에 month 필수를 담는다`() {
		listOf(SETTLEMENTS, SETTLEMENT_STAYS).forEach { path ->
			mockMvc.get(path) { with(user(masterPrincipal)) }.andExpectError(CommonErrorCode.INVALID_INPUT, "month" to message("validation.required"))
		}
	}

	@Test
	fun `정산 API 문서는 stay 태그에 month를 YYYY-MM 문자열로 보여준다`() {
		val docs = json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val operations = listOf(docs["paths"][SETTLEMENTS]["get"], docs["paths"][SETTLEMENT_STAYS]["get"])

		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("getSettlement", "getSettlementStays")
		assertThat(operations.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("stay"))
		operations.forEach { operation ->
			val month = operation["parameters"].values().first { it["name"].stringValue() == "month" }
			assertThat(month["required"].booleanValue()).isTrue()
			assertThat(month["schema"]["type"].stringValue()).isEqualTo("string")
			assertThat(month["schema"]["pattern"].stringValue()).isEqualTo(StaySettlementHotelAdminResponse.MONTH_PATTERN)
			assertThat(operation["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		}
		assertThat(docs["components"]["schemas"]["StaySettlementHotelAdminResponse"]["properties"]["totalAmount"]["format"].stringValue()).isEqualTo("int64")
	}

	private fun getSettlement(month: String): JsonNode =
		mockMvc.get(SETTLEMENTS) { with(user(masterPrincipal)); param("month", month) }.andExpectSuccess()

	private fun getSettlementStays(vararg params: Pair<String, Any>): JsonNode =
		mockMvc.get(SETTLEMENT_STAYS) {
			with(user(masterPrincipal))
			params.forEach { (name, value) -> param(name, value.toString()) }
		}.andExpectSuccess()

	private fun ResultActionsDsl.andExpectSuccess(): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(HttpStatus.OK.value())
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].isNull).isTrue()
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

	private fun settlementJson(month: String, totalAmount: Long, stayCount: Long, canceledCount: Long): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf("month" to month, "totalAmount" to totalAmount, "stayCount" to stayCount, "canceledCount" to canceledCount),
			),
		)

	private fun stayJson(stay: Stay, canceledAt: Instant?): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf(
					"id" to stay.id,
					"room" to linkedMapOf("id" to room.id, "name" to room.name),
					"roomType" to linkedMapOf("id" to roomType.id, "name" to roomType.name),
					"guest" to linkedMapOf("id" to guest.id, "name" to guest.name),
					"checkInDate" to stay.checkInDate.toString(),
					"checkOutDate" to stay.checkOutDate.toString(),
					"nights" to stay.nights,
					"totalAmount" to stay.totalAmount,
					"canceledAt" to canceledAt?.toString(),
				),
			),
		)

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, "${role.name.lowercase()}-$suffix@test.local", PASSWORD_HASH, "계정", role))

	private fun saveRoomType(hotel: Hotel): RoomType =
		roomTypeRepository.save(RoomType(hotel, "스탠다드", 4, 100000, LocalTime.of(15, 0), LocalTime.of(11, 0)))

	private fun saveRoom(hotel: Hotel, roomType: RoomType, name: String): Room = roomRepository.save(Room(hotel, name, roomType, null, null))

	private fun saveGuest(hotel: Hotel): Guest = guestRepository.save(Guest(hotel, "홍길동", "010-1234-5678", "guest@example.com"))

	private fun saveStay(room: Room, checkIn: LocalDate, checkOut: LocalDate, roomRate: Int, guest: Guest = this.guest): Stay =
		stayRepository.save(Stay(room, guest, checkIn, checkOut, 2, roomRate))

	private fun cancel(stay: Stay): Instant {
		jdbcTemplate.update(CANCEL_STAY, master.id, stay.id)
		return jdbcTemplate.queryForObject(SELECT_CANCELED_AT, Timestamp::class.java, stay.id)!!.toInstant()
	}

	private fun itemIds(data: JsonNode): List<Long> = data["items"].values().map { it["id"].longValue() }

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	companion object {
		private const val SETTLEMENTS = ApiPaths.HOTEL_ADMIN + ApiPaths.SETTLEMENTS
		private const val SETTLEMENT_STAYS = "$SETTLEMENTS/stays"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val MAX_ROOM_RATE = 10_000_000
		private const val FIELD_ERRORS = "fieldErrors"
		private const val CANCEL_STAY = "update stay set canceled_at = now(), canceled_by_id = ?, canceled_by_name = '계정' where id = ?"
		private const val SELECT_CANCELED_AT = "select canceled_at from stay where id = ?"
		private val DELETE_BY_HOTEL = listOf(
			"delete from stay where room_id in (select id from room where hotel_id = ?)",
			"delete from guest where hotel_id = ?",
			"delete from room where hotel_id = ?",
			"delete from room_type where hotel_id = ?",
			"delete from hotel_admin where hotel_id = ?",
		)
	}
}
