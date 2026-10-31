package com.marco.assignment.handys.urbanstay.member.controller.appadmin

import com.marco.assignment.handys.urbanstay.FixedClockConfiguration.Companion.TODAY
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.member.entity.Member
import com.marco.assignment.handys.urbanstay.member.exception.MemberErrorCode
import com.marco.assignment.handys.urbanstay.member.repository.MemberRepository
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import com.marco.assignment.handys.urbanstay.room.repository.RoomRepository
import com.marco.assignment.handys.urbanstay.room.repository.RoomTypeRepository
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
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
import java.time.Instant
import java.time.LocalTime
import java.util.Locale
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class MemberAppAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var memberRepository: MemberRepository

	@Autowired
	private lateinit var hotelRepository: HotelRepository

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

	private lateinit var kim: Member

	private lateinit var lee: Member

	@BeforeEach
	fun createMembers() {
		kim = memberRepository.save(Member("Kim_$suffix@Test.local", "password-hash", "김%회원", "010-1111-${suffix.take(4).map { it.code % 10 }.joinToString("")}"))
		lee = memberRepository.save(Member("lee-$suffix@test.local", "password-hash", "이회원 $suffix", "02-555-0000"))
	}

	@AfterEach
	fun deleteAll() {
		createdHotelIds.forEach { hotelId -> DELETE_BY_HOTEL.forEach { jdbcTemplate.update(it, hotelId) } }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
		memberRepository.deleteAllByIdInBatch(listOf(checkNotNull(kim.id), checkNotNull(lee.id)))
	}

	@Test
	fun `회원 목록은 최근 가입 순이고 검색어로 이름·이메일(대소문자 무시, 글자 그대로)과 하이픈을 뺀 전화번호에서 찾는다`() {
		assertThat(memberIds("keyword" to suffix)).containsExactly(lee.id, kim.id)
		assertThat(memberIds("keyword" to "KIM_${suffix.uppercase()}")).containsExactly(kim.id)
		assertThat(memberIds("keyword" to "김%")).contains(kim.id).doesNotContain(lee.id)
		assertThat(memberIds("keyword" to "_$suffix")).containsExactly(kim.id)
		assertThat(memberIds("keyword" to kim.phone.replace("-", "").drop(3))).contains(kim.id).doesNotContain(lee.id)

		val first = members("keyword" to suffix).andExpectSuccess()["items"][0]
		assertThat(first.propertyNames()).containsExactly("id", "email", "name", "phone", "createdAt")
		assertThat(listOf("email", "name", "phone").map { first[it].stringValue() }).containsExactly(lee.email, lee.name, lee.phone)
		assertThat(Instant.parse(first["createdAt"].stringValue())).isNotNull()
	}

	@Test
	fun `회원 상세는 회원 정보를, 없는 회원은 404 MEMBER_NOT_FOUND를 준다`() {
		assertThat(get("$MEMBERS/${kim.id}").andExpectSuccess()["email"].stringValue()).isEqualTo("kim_$suffix@test.local")
		get("$MEMBERS/$MISSING_ID").andExpectError(MemberErrorCode.MEMBER_NOT_FOUND)
	}

	@Test
	fun `회원의 호텔 이용 기록은 회원과 연결된 모든 호텔 이용객의 이용을 호텔·객실 이름과 함께 체크인 늦은 순으로 주고 없는 회원은 404다`() {
		val hotel = saveHotel("어반스테이 $suffix")
		val otherHotel = saveHotel("다른 호텔 $suffix")
		val room = saveRoom(hotel, "101")
		val otherRoom = saveRoom(otherHotel, "B동 201")
		val guest = guestRepository.save(Guest(hotel, "김회원", "010-2222-3333", "kim@test.local"))
		val otherGuest = guestRepository.save(Guest(otherHotel, "김회원", "010-2222-3333", "kim@test.local"))
		val unlinked = guestRepository.save(Guest(hotel, "남", "010-4444-5555", "other@test.local"))
		listOf(guest, otherGuest).forEach { jdbcTemplate.update(UPDATE_GUEST_MEMBER, kim.id, it.id) }
		val first = stayRepository.save(Stay(room, guest, TODAY.plusDays(1), TODAY.plusDays(2), 2, ROOM_RATE))
		val later = stayRepository.save(Stay(otherRoom, otherGuest, TODAY.plusDays(7), TODAY.plusDays(9), 3, ROOM_RATE))
		stayRepository.save(Stay(room, unlinked, TODAY.plusDays(20), TODAY.plusDays(21), 1, ROOM_RATE))

		val data = get("$MEMBERS/${kim.id}/stays").andExpectSuccess()

		assertThat(data["totalElements"].longValue()).isEqualTo(2)
		assertThat(data["items"].values().map { it["id"].longValue() }).containsExactly(later.id, first.id)
		assertThat(data["items"][0]).isEqualTo(
			json(
				jsonMapper.writeValueAsString(
					linkedMapOf(
						"id" to later.id,
						"hotel" to linkedMapOf("id" to otherHotel.id, "name" to otherHotel.name),
						"room" to linkedMapOf("id" to otherRoom.id, "name" to "B동 201"),
						"roomType" to linkedMapOf("id" to otherRoom.roomType.id, "name" to STANDARD),
						"checkInDate" to TODAY.plusDays(7).toString(),
						"checkOutDate" to TODAY.plusDays(9).toString(),
						"guestCount" to 3,
						"roomRate" to ROOM_RATE,
						"nights" to 2,
						"baseAmount" to ROOM_RATE * 2,
						"discountAmount" to 0,
						"totalAmount" to ROOM_RATE * 2,
						"canceledAt" to null,
					),
				),
			),
		)
		assertThat(get("$MEMBERS/${lee.id}/stays").andExpectSuccess()["items"].isEmpty).isTrue()
		get("$MEMBERS/$MISSING_ID/stays").andExpectError(MemberErrorCode.MEMBER_NOT_FOUND)
	}

	@Test
	fun `회원 API는 전체 어드민만 쓰고 문서는 app-admin 그룹의 member·stay 태그에 있다`() {
		mockMvc.get(MEMBERS).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get(MEMBERS) { with(user("operator").roles(Role.HOTEL_ADMIN.name)) }.andExpectError(CommonErrorCode.FORBIDDEN)

		val docs = json(mockMvc.get("/v3/api-docs/app-admin").andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val operations = listOf(MEMBERS, "$MEMBERS/{memberId}", "$MEMBERS/{memberId}/stays").map { docs["paths"][it]["get"] }
		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("getMembers", "getMember", "getMemberStays")
		assertThat(operations.map { it["tags"][0].stringValue() }).containsExactly("member", "member", "stay")
		assertThat(operations.drop(1).map { it["responses"].propertyNames().toSet() }).allSatisfy { assertThat(it).contains("404") }
	}

	private fun memberIds(vararg params: Pair<String, String>): List<Long> =
		members(*params, "size" to "100").andExpectSuccess()["items"].values().map { it["id"].longValue() }

	private fun members(vararg params: Pair<String, String>): ResultActionsDsl =
		mockMvc.get(MEMBERS) {
			with(user("tester").roles(Role.APP_ADMIN.name))
			params.forEach { (name, value) -> param(name, value) }
		}

	private fun get(path: String): ResultActionsDsl = mockMvc.get(path) { with(user("tester").roles(Role.APP_ADMIN.name)) }

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", "02-1234-5678", null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveRoom(hotel: Hotel, name: String): Room =
		roomRepository.save(Room(hotel, name, roomTypeRepository.save(RoomType(hotel, STANDARD, 4, ROOM_RATE, LocalTime.of(15, 0), LocalTime.of(11, 0))), null, null))

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
		assertThat(body["error"]["message"].stringValue()).isEqualTo(messageSource.getMessage(errorCode.messageKey, null, Locale.KOREAN))
	}

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	companion object {
		private const val MEMBERS = ApiPaths.APP_ADMIN + "/members"
		private const val STANDARD = "스탠다드"
		private const val ROOM_RATE = 100000
		private const val MISSING_ID = Long.MAX_VALUE
		private const val UPDATE_GUEST_MEMBER = "update guest set member_id = ? where id = ?"
		private val DELETE_BY_HOTEL = listOf(
			"delete from stay where room_id in (select id from room where hotel_id = ?)",
			"delete from guest where hotel_id = ?",
			"delete from room where hotel_id = ?",
			"delete from room_type where hotel_id = ?",
		)
	}
}
