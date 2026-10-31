package com.marco.assignment.handys.urbanstay.guest.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.exception.GuestErrorCode
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
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
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.core.userdetails.User
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
import java.util.Locale
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class GuestHotelAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var guestRepository: GuestRepository

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
		createdHotelIds.forEach {
			jdbcTemplate.update(DELETE_GUESTS, it)
			jdbcTemplate.update(DELETE_HOTEL_ADMINS, it)
		}
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `이용객 등록 API는 없어 로그인과 CSRF 토큰이 있어도 404 NOT_FOUND로 응답하고 등록하지 않는다`() {
		mockMvc.post(GUESTS) {
			with(user(masterPrincipal))
			withCsrf()
			jsonBody(updateBody(0) - "version")
		}.andExpectError(CommonErrorCode.NOT_FOUND)

		assertThat(guestIds(hotel)).isEmpty()
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 자기 호텔의 이용객을 수정에 쓸 version과 함께 200으로 조회한다`(role: HotelAdminRole) {
		val guest = saveGuest(hotel, PHONE)

		val data = getGuest(checkNotNull(guest.id), principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(guestJson(guest.id!!, NAME, PHONE, EMAIL, 0))
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 조회한 version으로 수정하면 모든 항목을 앞뒤 공백을 지운 값으로 바꾸고 version을 올려 200으로 응답한다`(role: HotelAdminRole) {
		val guest = saveGuest(hotel, PHONE)
		val body = updateBody(0, "name" to " 김철수 ", "phone" to "\t02-987-6543", "email" to " Kim@Example.com ")

		val data = update(guest.id!!, body, principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(guestJson(guest.id!!, "김철수", "02-987-6543", "Kim@Example.com", 1))
		assertThat(guestJson(reload(guest.id!!))).isEqualTo(data)
	}

	@Test
	fun `없는 id와 다른 호텔의 이용객 id로 조회하거나 수정하면 모두 404 GUEST_NOT_FOUND로 응답하고 바꾸지 않는다`() {
		val otherGuest = saveGuest(otherHotel, PHONE)

		listOf(MISSING_ID, checkNotNull(otherGuest.id)).forEach { id ->
			HotelAdminRole.entries.forEach { role ->
				getGuest(id, principals.getValue(role)).andExpectError(GuestErrorCode.GUEST_NOT_FOUND)
				update(id, updateBody(0, "name" to "김철수"), principals.getValue(role)).andExpectError(GuestErrorCode.GUEST_NOT_FOUND)
			}
		}
		assertUnchanged(otherGuest)
	}

	@Test
	fun `수정할 때 자기 전화번호는 하이픈 모양만 바꿔도 되고 같은 호텔의 다른 이용객과 숫자가 같아지면 409 GUEST_PHONE_DUPLICATED로 응답하고 바꾸지 않는다`() {
		saveGuest(hotel, OTHER_PHONE)
		val guest = saveGuest(hotel, PHONE)

		update(guest.id!!, updateBody(0, "phone" to OTHER_PHONE.replace("-", ""))).andExpectError(GuestErrorCode.GUEST_PHONE_DUPLICATED)
		assertUnchanged(guest)

		val data = update(guest.id!!, updateBody(0, "phone" to "01012345678")).andExpectSuccess(HttpStatus.OK)
		assertThat(listOf(data["phone"].stringValue(), data["version"].longValue())).containsExactly("01012345678", 1L)
	}

	@Test
	fun `같은 version으로 두 번 수정하면 먼저 수정한 쪽만 반영되고, version이 다르면서 전화번호도 겹치면 version 충돌인 409 GUEST_MODIFIED로 응답한다`() {
		saveGuest(hotel, OTHER_PHONE)
		val guest = saveGuest(hotel, PHONE)

		update(guest.id!!, updateBody(0, "name" to "먼저 수정")).andExpectSuccess(HttpStatus.OK)
		update(guest.id!!, updateBody(0, "name" to "나중 수정")).andExpectError(GuestErrorCode.GUEST_MODIFIED)
		update(guest.id!!, updateBody(0, "phone" to OTHER_PHONE)).andExpectError(GuestErrorCode.GUEST_MODIFIED)

		assertThat(guestJson(reload(guest.id!!))).isEqualTo(guestJson(guest.id!!, "먼저 수정", PHONE, EMAIL, 1))
	}

	@ParameterizedTest
	@ValueSource(strings = ["", " ", "\t", "　"])
	fun `수정할 때 이름, 전화번호, 이메일이 비어 있거나 공백만 있으면 필드마다 필수 입력 메시지 하나로 400 응답한다`(value: String) {
		val guest = saveGuest(hotel, PHONE)
		val expected = arrayOf("name" to message(REQUIRED), "phone" to message(REQUIRED), "email" to message(REQUIRED))

		update(guest.id!!, updateBody(0, "name" to value, "phone" to value, "email" to value)).andExpectError(CommonErrorCode.INVALID_INPUT, *expected)
		assertUnchanged(guest)
	}

	@Test
	fun `이름의 최대 길이는 앞뒤 공백을 지운 값으로 세고 넘으면 최대 길이 메시지로 400 응답한다`() {
		val guest = saveGuest(hotel, PHONE)
		val name = "가".repeat(Guest.NAME_MAX_LENGTH)

		update(guest.id!!, updateBody(0, "name" to "${name}가")).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to maxLength(Guest.NAME_MAX_LENGTH))
		assertThat(update(guest.id!!, updateBody(0, "name" to " $name ")).andExpectSuccess(HttpStatus.OK)["name"].stringValue()).isEqualTo(name)
	}

	@ParameterizedTest
	@MethodSource("phoneErrors")
	fun `수정할 때 전화번호 오류는 빈 값, 형식, 길이 순으로 하나만 응답한다`(phone: String, messageKey: String) {
		val guest = saveGuest(hotel, PHONE)
		val expected = if (messageKey == MAX_LENGTH) maxLength(Guest.PHONE_MAX_LENGTH) else message(messageKey)

		update(guest.id!!, updateBody(0, "phone" to phone)).andExpectError(CommonErrorCode.INVALID_INPUT, "phone" to expected)
		assertUnchanged(guest)
	}

	@ParameterizedTest
	@MethodSource("emailErrors")
	fun `수정할 때 이메일 오류는 빈 값, 형식, 길이 순으로 하나만 응답한다`(email: String, messageKey: String) {
		val guest = saveGuest(hotel, PHONE)
		val expected = if (messageKey == MAX_LENGTH) maxLength(Guest.EMAIL_MAX_LENGTH) else message(messageKey)

		update(guest.id!!, updateBody(0, "email" to email)).andExpectError(CommonErrorCode.INVALID_INPUT, "email" to expected)
		assertUnchanged(guest)
	}

	@ParameterizedTest
	@ValueSource(strings = ["12345678", "010-1234-5678", "01012345678", "02--1234-5678"])
	fun `숫자와 -만 있고 숫자가 8~11개인 전화번호는 입력한 모양 그대로 저장한다`(phone: String) {
		val guest = saveGuest(hotel, OTHER_PHONE)

		assertThat(update(guest.id!!, updateBody(0, "phone" to phone)).andExpectSuccess(HttpStatus.OK)["phone"].stringValue()).isEqualTo(phone)
	}

	@ParameterizedTest
	@ValueSource(strings = ["name", "phone", "email", "version"])
	fun `필수 항목이 없거나 null이면 필수 입력 메시지로 400 응답한다`(field: String) {
		val guest = saveGuest(hotel, PHONE)

		update(guest.id!!, updateBody(0) - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		update(guest.id!!, updateBody(0, field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		assertUnchanged(guest)
	}

	@ParameterizedTest
	@MethodSource("typeMismatches")
	fun `항목에 다른 타입을 보내면 형식 메시지로 400 응답한다`(field: String, value: Any) {
		val guest = saveGuest(hotel, PHONE)

		update(guest.id!!, updateBody(0, field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
		assertUnchanged(guest)
	}

	@ParameterizedTest
	@ValueSource(strings = ["id", "hotelId"])
	fun `문서에 없는 id나 호텔 항목을 보내면 알 수 없는 항목 메시지로 400 응답하고 바꾸지 않는다`(field: String) {
		val guest = saveGuest(hotel, PHONE)

		update(guest.id!!, updateBody(0, field to otherHotel.id)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(UNKNOWN_FIELD))
		assertUnchanged(guest)
	}

	@ParameterizedTest
	@EnumSource(HotelAdminRole::class)
	fun `마스터와 운영자 모두 목록을 기본값 page 0, size 10으로 자기 호텔 이용객만 최근 등록 순으로 조회한다`(role: HotelAdminRole) {
		val ids = (1..11).map { checkNotNull(saveGuest(hotel, phone(it)).id) }
		saveGuest(otherHotel, phone(12))

		val data = getGuests(principal = principals.getValue(role)).andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.reversed().take(10))
		assertThat(pageInfo(data)).containsExactly(0, 10, 11, 2)
		assertThat(data["items"][0]).isEqualTo(guestJson(ids.last(), NAME, phone(11), EMAIL, 0))
		assertThat(itemIds(getGuests("page" to "1", principal = principals.getValue(role)).andExpectSuccess(HttpStatus.OK))).containsExactly(ids.first())
	}

	@Test
	fun `page와 size로 원하는 페이지를 조회한다`() {
		val ids = (1..7).map { checkNotNull(saveGuest(hotel, phone(it)).id) }.reversed()

		val data = getGuests("page" to "1", "size" to "3").andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.subList(3, 6))
		assertThat(pageInfo(data)).containsExactly(1, 3, 7, 3)
	}

	@ParameterizedTest
	@CsvSource(
		"page, -1, validation.min, 0",
		"page, 100, validation.max, 99",
		"size, 0, validation.min, 1",
		"size, 101, validation.max, 100",
	)
	fun `범위를 벗어난 page와 size는 파라미터 이름과 범위 메시지로 400 응답한다`(parameter: String, value: String, messageKey: String, bound: String) {
		getGuests(parameter to value).andExpectError(CommonErrorCode.INVALID_INPUT, parameter to message(messageKey).replace("{value}", bound))
	}

	@Test
	fun `검색어가 이름에 들어 있으면 대소문자 구분 없이, 전화번호에 들어 있으면 양쪽 하이픈을 빼고 자기 호텔 이용객만 최근 등록 순으로 찾는다`() {
		val byName = checkNotNull(saveGuest(hotel, "010-0000-0001", "Kim 1234").id)
		val dashed = checkNotNull(saveGuest(hotel, "010-1234-5678").id)
		val plain = checkNotNull(saveGuest(hotel, "01099991234").id)
		saveGuest(hotel, "010-5555-6666", "이영희")
		saveGuest(otherHotel, "010-1234-0000", "KIM 1234")

		val found = getGuests("keyword" to " 1234 ").andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(found)).containsExactly(plain, dashed, byName)
		assertThat(pageInfo(found)).containsExactly(0, 10, 3, 1)
		assertThat(itemIds(getGuests("keyword" to "kIm").andExpectSuccess(HttpStatus.OK))).containsExactly(byName)
		assertThat(itemIds(getGuests("keyword" to "01012345678").andExpectSuccess(HttpStatus.OK))).containsExactly(dashed)
		assertThat(itemIds(getGuests("keyword" to "9-1234").andExpectSuccess(HttpStatus.OK))).containsExactly(plain)
		assertThat(pageInfo(getGuests("keyword" to "없는 이용객").andExpectSuccess(HttpStatus.OK))).containsExactly(0, 10, 0, 0)
	}

	@ParameterizedTest
	@ValueSource(strings = ["", "   ", "　"])
	fun `검색어가 비어 있거나 공백만 있으면 거르지 않고 전체 목록을 조회한다`(keyword: String) {
		val ids = (1..3).map { checkNotNull(saveGuest(hotel, phone(it)).id) }

		assertThat(itemIds(getGuests("keyword" to keyword).andExpectSuccess(HttpStatus.OK))).containsExactlyElementsOf(ids.reversed())
	}

	@ParameterizedTest
	@CsvSource("'50%', '50원'", "'a_b', 'axb'", "'c\\d', 'cd'")
	fun `검색어의 퍼센트, 밑줄, 역슬래시는 와일드카드가 아니라 글자 그대로 찾는다`(literal: String, decoy: String) {
		val target = checkNotNull(saveGuest(hotel, PHONE, "이용객 $literal").id)
		saveGuest(hotel, OTHER_PHONE, "이용객 $decoy")

		assertThat(itemIds(getGuests("keyword" to literal).andExpectSuccess(HttpStatus.OK))).containsExactly(target)
	}

	@Test
	fun `검색어는 앞뒤 공백을 지운 길이로 세어 100자를 넘으면 최대 길이 메시지로 400 응답한다`() {
		val max = GuestHotelAdminController.KEYWORD_MAX_LENGTH

		getGuests("keyword" to " ${"가".repeat(max)} ").andExpectSuccess(HttpStatus.OK)
		getGuests("keyword" to "가".repeat(max + 1)).andExpectError(CommonErrorCode.INVALID_INPUT, "keyword" to maxLength(max))
	}

	@Test
	fun `로그인하지 않으면 이용객 API는 401 UNAUTHORIZED로 응답하고 바꾸지 않는다`() {
		val guest = saveGuest(hotel, PHONE)

		mockMvc.get(GUESTS).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get("$GUESTS/${guest.id}").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.put("$GUESTS/${guest.id}") { withCsrf(); jsonBody(updateBody(0, "name" to "김철수")) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		assertUnchanged(guest)
	}

	@Test
	fun `전체 어드민 역할로는 이용객 API를 쓸 수 없어 403 FORBIDDEN으로 응답하고 바꾸지 않는다`() {
		val guest = saveGuest(hotel, PHONE)
		val appAdmin = User.withUsername(USERNAME).password(PASSWORD_HASH).roles(Role.APP_ADMIN.name).build()

		getGuests(principal = appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		getGuest(checkNotNull(guest.id), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		update(guest.id!!, updateBody(0, "name" to "김철수"), appAdmin).andExpectError(CommonErrorCode.FORBIDDEN)
		assertUnchanged(guest)
	}

	@Test
	fun `CSRF 토큰 없이 수정하면 403 INVALID_CSRF_TOKEN으로 응답하고 바꾸지 않는다`() {
		val guest = saveGuest(hotel, PHONE)

		mockMvc.put("$GUESTS/${guest.id}") { with(user(masterPrincipal)); jsonBody(updateBody(0, "name" to "김철수")) }
			.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		assertUnchanged(guest)
	}

	@Test
	fun `이용객 API 문서는 guest 태그에 operation마다 낼 수 있는 이용객 에러를 예시로 보여준다`() {
		val docs = apiDocs()
		val guests = docs["paths"][GUESTS]
		val guest = docs["paths"]["$GUESTS/{guestId}"]
		val operations = listOf(guests["get"], guest["get"], guest["put"])

		assertThat(guests.has("post")).isFalse()
		assertThat(docs["components"]["schemas"].has("GuestCreateHotelAdminRequest")).isFalse()
		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("getGuests", "getGuest", "updateGuest")
		assertThat(operations.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("guest"))
		assertThat(docs["tags"].values().single { it["name"].stringValue() == "guest" }["description"].stringValue())
			.isEqualTo(message("openapi.hotel-admin.tag.guest"))
		assertThat(guests["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(guest["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "500")
		listOf(guest["get"], guest["put"]).forEach { op ->
			assertThat(errorCodes(op, HttpStatus.NOT_FOUND)).containsExactly(GuestErrorCode.GUEST_NOT_FOUND.code)
		}
		assertThat(guest["put"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "404", "409", "500")
		assertThat(errorCodes(guest["put"], HttpStatus.CONFLICT))
			.containsExactlyInAnyOrder(GuestErrorCode.GUEST_PHONE_DUPLICATED.code, GuestErrorCode.GUEST_MODIFIED.code)
		assertThat(guests["get"]["responses"]["200"]["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponsePageResponseGuestHotelAdminResponse"))
		assertThat(guests["get"]["parameters"].values().map { it["name"].stringValue() }).containsExactly("keyword", "page", "size")
	}

	@Test
	fun `이용객 수정 요청 문서는 모든 항목이 필수이고 이름 길이, 전화번호와 이메일의 형식과 길이를 보여준다`() {
		val request = apiDocs()["components"]["schemas"]["GuestUpdateHotelAdminRequest"]
		val properties = request["properties"]
		val required = listOf("name", "phone", "email", "version")
		val rules = listOf("name", "phone", "email").associateWith { field ->
			listOf("minLength", "maxLength", "pattern").map { properties[field][it]?.asString() }
		}

		assertThat(required(request)).containsExactlyInAnyOrderElementsOf(required)
		assertThat(properties.propertyNames()).containsExactlyInAnyOrderElementsOf(required)
		assertThat(rules).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"name" to listOf("1", Guest.NAME_MAX_LENGTH.toString(), null),
				"phone" to listOf("1", Guest.PHONE_MAX_LENGTH.toString(), Hotel.PHONE_PATTERN),
				"email" to listOf("1", Guest.EMAIL_MAX_LENGTH.toString(), LoginId.PATTERN),
			),
		)
	}

	private fun getGuests(vararg params: Pair<String, String>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get(GUESTS) {
			with(user(principal))
			params.forEach { (name, value) -> param(name, value) }
		}

	private fun getGuest(id: Long, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get("$GUESTS/$id") { with(user(principal)) }

	private fun update(id: Long, body: Map<String, Any?>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.put("$GUESTS/$id") {
			with(user(principal))
			withCsrf()
			jsonBody(body)
		}

	private fun MockHttpServletRequestDsl.withCsrf() {
		cookie(xsrf)
		header(XSRF_HEADER, xsrf.value)
	}

	private fun MockHttpServletRequestDsl.jsonBody(body: Map<String, Any?>) {
		contentType = MediaType.APPLICATION_JSON
		content = jsonMapper.writeValueAsString(body)
	}

	private fun updateBody(version: Long, vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>("name" to NAME, "phone" to PHONE, "email" to EMAIL, "version" to version) + overrides

	private fun phone(number: Int): String = "010-0000-%04d".format(number)

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", HOTEL_PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, PASSWORD_HASH, "계정", role))

	private fun saveGuest(hotel: Hotel, phone: String, name: String = NAME): Guest = guestRepository.save(Guest(hotel, name, phone, EMAIL))

	private fun reload(id: Long): Guest = guestRepository.findById(id).orElseThrow()

	private fun assertUnchanged(guest: Guest) {
		assertThat(guestJson(reload(checkNotNull(guest.id)))).isEqualTo(guestJson(guest))
	}

	private fun guestIds(hotel: Hotel): List<Long> =
		jdbcTemplate.queryForList(SELECT_GUEST_IDS, Long::class.javaObjectType, hotel.id).filterNotNull()

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus): JsonNode {
		val result = andReturn()
		val body = json(result.response)
		assertThat(result.response.status).isEqualTo(status.value())
		assertThat(body.properties().map { it.key }).containsExactly("success", "data", "message", "error")
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].stringValue(null)).isEqualTo(successMessage(result.request))
		assertThat(body["error"].isNull).isTrue()
		return body["data"]
	}

	private fun successMessage(request: MockHttpServletRequest): String? =
		SUCCESS_MESSAGE_KEYS.entries.firstOrNull { it.key.matches("${request.method} ${request.requestURI}") }?.value?.let(::message)

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) {
		val response = andReturn().response
		val body = json(response)
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().map { it["field"].stringValue() to it["message"].stringValue() }
		val expected = mapOf("success" to false, "data" to null, "message" to null, "error" to mapOf("code" to errorCode.code, "message" to message(errorCode.messageKey)))

		assertThat(response.status).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json(jsonMapper.writeValueAsString(expected)))
		assertThat(actualFieldErrors).containsExactlyInAnyOrder(*fieldErrors)
	}

	private fun guestJson(id: Long, name: String, phone: String, email: String, version: Long): JsonNode =
		json(jsonMapper.writeValueAsString(linkedMapOf("id" to id, "name" to name, "phone" to phone, "email" to email, "version" to version)))

	private fun guestJson(guest: Guest): JsonNode = guestJson(checkNotNull(guest.id), guest.name, guest.phone, guest.email, guest.version)

	private fun itemIds(data: JsonNode): List<Long> = data["items"].values().map { it["id"].longValue() }

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

	private fun errorCodes(operation: JsonNode, status: HttpStatus): List<String> {
		val content = operation["responses"][status.value().toString()]["content"][JSON]
		val examples = content["example"]?.let { listOf(it) } ?: content["examples"].values().map { it["value"] }
		return examples.map { it["error"]["code"].stringValue() }
	}

	private fun required(schema: JsonNode): List<String> = schema.path("required").values().map { it.stringValue() }

	private fun schemaRef(name: String): JsonNode = json("""{"${'$'}ref":"#/components/schemas/$name"}""")

	private fun json(response: MockHttpServletResponse): JsonNode = json(response.getContentAsString(StandardCharsets.UTF_8))

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private fun maxLength(max: Int): String = message(MAX_LENGTH).replace("{max}", max.toString())

	companion object {
		private const val GUESTS = ApiPaths.HOTEL_ADMIN + "/guests"
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val HOTEL_PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val USERNAME = "tester"
		private const val NAME = "홍길동"
		private const val PHONE = "010-1234-5678"
		private const val OTHER_PHONE = "010-8765-4321"
		private const val EMAIL = "guest@example.com"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val REQUIRED = "validation.required"
		private const val TYPE = "validation.type"
		private const val MAX_LENGTH = "validation.max-length"
		private const val PHONE_FORMAT = "validation.phone"
		private const val EMAIL_FORMAT = "validation.email"
		private const val UNKNOWN_FIELD = "validation.unknown-field"
		private const val MISSING_ID = Long.MAX_VALUE
		private val SUCCESS_MESSAGE_KEYS = mapOf(
			Regex("PUT $GUESTS/\\d+") to "success.guest.updated",
		)
		private const val DELETE_GUESTS = "delete from guest where hotel_id = ?"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val SELECT_GUEST_IDS = "select id from guest where hotel_id = ? order by id"

		@JvmStatic
		fun phoneErrors(): List<Arguments> = listOf(
			Arguments.of(" 　 ", REQUIRED),
			Arguments.of("1234567", PHONE_FORMAT),
			Arguments.of("+82-10-1234-5678", PHONE_FORMAT),
			Arguments.of("010 1234 5678", PHONE_FORMAT),
			Arguments.of("０１０-１２３４-５６７８", PHONE_FORMAT),
			Arguments.of("02-1234-56789-0-0-0-0-0", PHONE_FORMAT),
			Arguments.of("0-1-2-3-4-5-6-7-8-9-0", MAX_LENGTH),
		)

		@JvmStatic
		fun emailErrors(): List<Arguments> {
			val tooLong = "a".repeat(Guest.EMAIL_MAX_LENGTH - "@test.local".length + 1) + "@test.local"
			return listOf(
				Arguments.of(" \t ", REQUIRED),
				Arguments.of("guest", EMAIL_FORMAT),
				Arguments.of("guest@test", EMAIL_FORMAT),
				Arguments.of("gu est@test.local", EMAIL_FORMAT),
				Arguments.of("홍길동@x.com", EMAIL_FORMAT),
				Arguments.of(" $tooLong ", MAX_LENGTH),
			)
		}

		@JvmStatic
		fun typeMismatches(): List<Arguments> = listOf(
			Arguments.of("name", 123),
			Arguments.of("phone", 1012345678),
			Arguments.of("email", listOf(EMAIL)),
			Arguments.of("version", "0"),
			Arguments.of("version", 0.5),
		)
	}
}
