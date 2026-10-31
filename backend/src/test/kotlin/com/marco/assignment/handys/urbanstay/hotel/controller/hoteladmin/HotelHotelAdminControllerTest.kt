package com.marco.assignment.handys.urbanstay.hotel.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import jakarta.servlet.http.Cookie
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
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
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
class HotelHotelAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

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

	private lateinit var master: UserDetails

	private lateinit var operator: UserDetails

	@BeforeEach
	fun createHotel() {
		hotel = saveHotel("어반스테이 $suffix", "서울 $suffix")
		master = HotelAdminPrincipal.from(saveHotelAdmin("master-$suffix@test.local", HotelAdminRole.MASTER))
		operator = HotelAdminPrincipal.from(saveHotelAdmin("operator-$suffix@test.local", HotelAdminRole.OPERATOR))
	}

	@AfterEach
	fun deleteHotels() {
		createdHotelIds.forEach { jdbcTemplate.update(DELETE_HOTEL_ADMINS, it) }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `마스터는 세션의 호텔 정보를 version과 함께 조회한다`() {
		saveHotel("다른 호텔 $suffix", "부산 $suffix")

		val data = getHotel(master).andExpectSuccess(null)

		assertThat(data).isEqualTo(hotelJson(checkNotNull(hotel.id), hotel.name, hotel.address, PHONE, DESCRIPTION, 0))
	}

	@Test
	fun `마스터가 조회한 version으로 수정하면 앞뒤 공백을 지워 모든 항목을 바꾸고 version을 올려 200으로 응답한다`() {
		val data = update(body("name" to " 새 이름 $suffix ", "address" to "\t부산 $suffix ", "phone" to " 051-123-4567 ", "description" to "  ", "version" to 0))
			.andExpectSuccess("success.hotel.updated")

		assertThat(data).isEqualTo(hotelJson(checkNotNull(hotel.id), "새 이름 $suffix", "부산 $suffix", "051-123-4567", null, 1))
		assertThat(getHotel(master).andExpectSuccess(null)).isEqualTo(data)
	}

	@Test
	fun `운영자와 전체 어드민은 조회·수정 모두 403, 로그인하지 않으면 401로 응답하고 호텔을 바꾸지 않는다`() {
		val appAdmin = User.withUsername("tester").password("password-hash").roles(Role.APP_ADMIN.name).build()

		listOf(operator, appAdmin).forEach { principal ->
			getHotel(principal).andExpectError(CommonErrorCode.FORBIDDEN)
			update(body("name" to "바뀐 이름", "version" to 0), principal).andExpectError(CommonErrorCode.FORBIDDEN)
		}
		mockMvc.get(HOTEL).andExpectError(CommonErrorCode.UNAUTHORIZED)

		assertThat(listOf(reload().name, reload().version)).containsExactly(hotel.name, 0L)
	}

	@Test
	fun `값이 규칙에 맞지 않으면 필드마다 오류 하나로 400 응답하고 바꾸지 않는다`() {
		update(body("name" to " ", "address" to "가".repeat(Hotel.ADDRESS_MAX_LENGTH + 1), "phone" to "02-12a4-5678", "description" to "가".repeat(Hotel.DESCRIPTION_MAX_LENGTH + 1)))
			.andExpectError(
				CommonErrorCode.INVALID_INPUT,
				"name" to message("validation.required"),
				"address" to message("validation.max-length").replace("{max}", Hotel.ADDRESS_MAX_LENGTH.toString()),
				"phone" to message("validation.phone"),
				"description" to message("validation.max-length").replace("{max}", Hotel.DESCRIPTION_MAX_LENGTH.toString()),
			)
		update(body() - "version").andExpectError(CommonErrorCode.INVALID_INPUT, "version" to message("validation.required"))

		assertThat(reload().version).isZero()
	}

	@Test
	fun `다른 호텔과 이름·주소가 모두 같아지면 409 HOTEL_DUPLICATED이고 자기 이름·주소를 그대로 두는 수정은 된다`() {
		val other = saveHotel("다른 호텔 $suffix", "부산 $suffix")

		update(body("name" to " ${other.name} ", "address" to other.address)).andExpectError(HotelErrorCode.HOTEL_DUPLICATED)
		assertThat(reload().version).isZero()

		val data = update(body("phone" to "02-9999-0000")).andExpectSuccess("success.hotel.updated")
		assertThat(listOf(data["name"].stringValue(), data["address"].stringValue(), data["version"].longValue())).containsExactly(hotel.name, hotel.address, 1L)
	}

	@Test
	fun `version이 다르면 409 HOTEL_MODIFIED로 응답하고 이름·주소가 겹쳐도 version 충돌이 먼저다`() {
		val other = saveHotel("다른 호텔 $suffix", "부산 $suffix")
		update(body("phone" to "02-9999-0000")).andExpectSuccess("success.hotel.updated")

		update(body("name" to "늦은 수정", "version" to 0)).andExpectError(HotelErrorCode.HOTEL_MODIFIED)
		update(body("name" to other.name, "address" to other.address, "version" to 0)).andExpectError(HotelErrorCode.HOTEL_MODIFIED)

		assertThat(listOf(reload().name, reload().version)).containsExactly(hotel.name, 1L)
	}

	@Test
	fun `문서는 hotel-admin 그룹의 hotel 태그에 있고 수정은 409 에러를 가진다`() {
		val docs = json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))
		val get = docs["paths"][HOTEL]["get"]
		val put = docs["paths"][HOTEL]["put"]

		assertThat(listOf(get["operationId"].stringValue(), put["operationId"].stringValue())).containsExactly("getHotel", "updateHotel")
		assertThat((get["tags"].values() + put["tags"].values()).map { it.stringValue() }).containsOnly("hotel")
		assertThat(get["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(put["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "409", "500")
	}

	private fun getHotel(principal: UserDetails): ResultActionsDsl = mockMvc.get(HOTEL) { with(user(principal)) }

	private fun update(body: Map<String, Any?>, principal: UserDetails = master): ResultActionsDsl =
		mockMvc.put(HOTEL) {
			with(user(principal))
			cookie(xsrf)
			header(XSRF_HEADER, xsrf.value)
			contentType = MediaType.APPLICATION_JSON
			content = jsonMapper.writeValueAsString(body)
		}

	private fun body(vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>(
			"name" to hotel.name,
			"address" to hotel.address,
			"phone" to PHONE,
			"description" to DESCRIPTION,
			"version" to 0,
		) + overrides

	private fun saveHotel(name: String, address: String): Hotel =
		hotelRepository.save(Hotel(name, address, PHONE, DESCRIPTION)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, "password-hash", "계정", role))

	private fun reload(): Hotel = hotelRepository.findById(checkNotNull(hotel.id)).orElseThrow()

	private fun ResultActionsDsl.andExpectSuccess(messageKey: String?): JsonNode {
		val response = andReturn().response
		val body = json(response.getContentAsString(StandardCharsets.UTF_8))
		assertThat(response.status).isEqualTo(HttpStatus.OK.value())
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

	private fun hotelJson(id: Long, name: String, address: String, phone: String, description: String?, version: Long): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf("id" to id, "name" to name, "address" to address, "phone" to phone, "description" to description, "version" to version),
			),
		)

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	companion object {
		private const val HOTEL = ApiPaths.HOTEL_ADMIN + ApiPaths.HOTEL
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val PHONE = "02-1234-5678"
		private const val DESCRIPTION = "소개"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
	}
}
