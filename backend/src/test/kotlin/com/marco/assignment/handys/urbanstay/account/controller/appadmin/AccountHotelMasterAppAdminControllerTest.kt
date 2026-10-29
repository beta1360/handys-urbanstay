package com.marco.assignment.handys.urbanstay.account.controller.appadmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
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
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
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
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
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
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class AccountHotelMasterAppAdminControllerTest {

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

	private val executor = Executors.newFixedThreadPool(CONCURRENT_REQUESTS)

	private val suffix = UUID.randomUUID().toString().take(8)
	private val masterLoginId = "master-$suffix@test.local"
	private val otherMasterLoginId = "other-master-$suffix@test.local"

	private val createdHotelIds = mutableListOf<Long>()

	private val xsrf: Cookie by lazy { checkNotNull(mockMvc.get(APP_ADMIN_ME).andReturn().response.getCookie(XSRF_COOKIE)) }

	private lateinit var hotel: Hotel

	private val hotelId: Long get() = checkNotNull(hotel.id)

	private lateinit var master: HotelAdmin

	private lateinit var otherMaster: HotelAdmin

	@BeforeEach
	fun createMasters() {
		hotel = saveHotel("어반스테이 $suffix")
		master = saveHotelAdmin(hotel, masterLoginId, HotelAdminRole.MASTER)
		otherMaster = saveHotelAdmin(saveHotel("다른 호텔 $suffix"), otherMasterLoginId, HotelAdminRole.MASTER)
	}

	@AfterEach
	fun deleteHotels() {
		executor.shutdownNow()
		createdHotelIds.forEach { jdbcTemplate.update(DELETE_HOTEL_ADMINS, it) }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
	}

	@Test
	fun `마스터를 조회하면 비밀번호 없이 아이디, 이름, version을 200으로 응답한다`() {
		val data = mockMvc.get(masterPath(hotelId)) { loggedIn() }.andExpectSuccess()

		assertThat(data).isEqualTo(masterJson(checkNotNull(master.id), masterLoginId, MASTER_NAME, 0))
	}

	@Test
	fun `없는 호텔의 마스터를 조회하거나 수정하면 404 HOTEL_NOT_FOUND로 응답한다`() {
		mockMvc.get(masterPath(MISSING_ID)) { loggedIn() }.andExpectError(HotelErrorCode.HOTEL_NOT_FOUND)
		update(MISSING_ID, updateBody(0)).andExpectError(HotelErrorCode.HOTEL_NOT_FOUND)
	}

	@Test
	fun `운영자만 있고 마스터가 없는 호텔이면 조회와 수정 모두 404 HOTEL_MASTER_NOT_FOUND로 응답한다`() {
		val noMasterHotel = saveHotel("마스터 없는 호텔 $suffix")
		val noMasterHotelId = checkNotNull(noMasterHotel.id)
		val operator = saveHotelAdmin(noMasterHotel, "operator-$suffix@test.local", HotelAdminRole.OPERATOR)

		mockMvc.get(masterPath(noMasterHotelId)) { loggedIn() }.andExpectError(AccountErrorCode.HOTEL_MASTER_NOT_FOUND)
		update(noMasterHotelId, updateBody(0, "loginId" to operator.loginId)).andExpectError(AccountErrorCode.HOTEL_MASTER_NOT_FOUND)
		assertUnchanged(operator)
	}

	@Test
	fun `조회한 version으로 아이디와 이름을 바꾸면 아이디는 소문자로, 이름은 앞뒤 공백을 지워 저장하고 version과 로그인 정보 버전을 올려 200으로 응답한다`() {
		val data = update(hotelId, updateBody(0, "loginId" to " New-Master-$suffix@Test.LOCAL\t", "name" to " 새 이름 ")).andExpectSuccess()

		assertThat(data).isEqualTo(masterJson(checkNotNull(master.id), "new-master-$suffix@test.local", "새 이름", 1))
		val saved = reload(master)
		assertThat(masterJson(saved)).isEqualTo(data)
		assertThat(saved.credentialVersion).isEqualTo(1)
	}

	@Test
	fun `이름만 바꾸면 version은 올리고 로그인 정보 버전은 그대로 둔다`() {
		val data = update(hotelId, updateBody(0, "name" to "새 이름")).andExpectSuccess()

		assertThat(data).isEqualTo(masterJson(checkNotNull(master.id), masterLoginId, "새 이름", 1))
		assertThat(reload(master).credentialVersion).isZero()
	}

	@Test
	fun `자기 아이디를 대소문자와 앞뒤 공백만 바꿔 보내면 중복이 아니고 같은 아이디라 로그인 정보 버전을 올리지 않는다`() {
		val data = update(hotelId, updateBody(0, "loginId" to " ${masterLoginId.uppercase()} ", "name" to "새 이름")).andExpectSuccess()

		assertThat(data).isEqualTo(masterJson(checkNotNull(master.id), masterLoginId, "새 이름", 1))
		assertThat(reload(master).credentialVersion).isZero()
	}

	@Test
	fun `바뀐 값이 없는 수정은 version을 올리지 않고 200으로 응답한다`() {
		val data = update(hotelId, updateBody(0, "loginId" to masterLoginId.uppercase(), "name" to " $MASTER_NAME ")).andExpectSuccess()

		assertThat(data).isEqualTo(masterJson(master))
		assertThat(masterJson(reload(master))).isEqualTo(data)
	}

	@ParameterizedTest
	@ValueSource(strings = ["other-master-%s@test.local", " OTHER-MASTER-%s@Test.Local ", "other-operator-%s@test.local"])
	fun `아이디를 다른 호텔 계정이 쓰고 있으면 대소문자와 앞뒤 공백과 관계없이 409 LOGIN_ID_DUPLICATED로 응답하고 바꾸지 않는다`(loginId: String) {
		saveHotelAdmin(otherMaster.hotel, "other-operator-$suffix@test.local", HotelAdminRole.OPERATOR)

		update(hotelId, updateBody(0, "loginId" to loginId.format(suffix), "name" to "새 이름")).andExpectError(AccountErrorCode.LOGIN_ID_DUPLICATED)

		assertUnchanged(master)
	}

	@Test
	fun `같은 version으로 두 번 수정하면 먼저 수정한 쪽만 반영되고 나중 수정은 409 HOTEL_ADMIN_MODIFIED로 응답한다`() {
		update(hotelId, updateBody(0, "name" to "먼저 수정")).andExpectSuccess()
		update(hotelId, updateBody(0, "name" to "나중 수정")).andExpectError(AccountErrorCode.HOTEL_ADMIN_MODIFIED)

		val saved = reload(master)
		assertThat(listOf(saved.name, saved.version)).containsExactly("먼저 수정", 1L)
	}

	@Test
	fun `version이 다르면서 아이디도 겹치면 version 충돌인 409 HOTEL_ADMIN_MODIFIED로 응답한다`() {
		update(hotelId, updateBody(0, "name" to "먼저 수정")).andExpectSuccess()

		update(hotelId, updateBody(0, "loginId" to otherMasterLoginId)).andExpectError(AccountErrorCode.HOTEL_ADMIN_MODIFIED)
		assertThat(reload(master).loginId).isEqualTo(masterLoginId)
	}

	@Test
	fun `같은 version으로 동시에 수정하면 하나만 200으로 반영되고 나머지는 409 HOTEL_ADMIN_MODIFIED로 응답한다`() {
		val responses = concurrently { index -> update(hotelId, updateBody(0, "name" to "동시 수정 $index")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.OK.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, AccountErrorCode.HOTEL_ADMIN_MODIFIED)
		val winner = json(responses.single { it.status == HttpStatus.OK.value() })["data"]
		assertThat(masterJson(reload(master))).isEqualTo(winner)
		assertThat(winner["version"].longValue()).isEqualTo(1)
	}

	@Test
	fun `서로 다른 호텔의 마스터를 같은 새 아이디로 동시에 바꾸면 하나만 200으로 반영되고 나머지는 409 LOGIN_ID_DUPLICATED로 응답한다`() {
		val newLoginId = "concurrent-$suffix@test.local"
		val masters = listOf(master, otherMaster)

		val responses = concurrently { index ->
			update(checkNotNull(masters[index].hotel.id), updateBody(0, "loginId" to newLoginId)).andReturn().response
		}

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.OK.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, AccountErrorCode.LOGIN_ID_DUPLICATED)
		val winnerId = json(responses.single { it.status == HttpStatus.OK.value() })["data"]["id"].longValue()
		val loser = masters.single { it.id != winnerId }
		assertThat(masters.map { reload(it).loginId }).containsOnlyOnce(newLoginId)
		assertUnchanged(loser)
	}

	@ParameterizedTest
	@MethodSource("loginIdErrors")
	fun `아이디는 앞뒤 공백을 지운 뒤 빈 값, 이메일 형식, 길이 순으로 오류 하나만 응답하고 바꾸지 않는다`(loginId: String, messageKey: String) {
		val expected = if (messageKey == MAX_LENGTH) maxLength(HotelAdmin.LOGIN_ID_MAX_LENGTH) else message(messageKey)

		update(hotelId, updateBody(0, "loginId" to loginId)).andExpectError(CommonErrorCode.INVALID_INPUT, "loginId" to expected)
		assertUnchanged(master)
	}

	@ParameterizedTest
	@ValueSource(strings = ["", " ", "\t", "　"])
	fun `이름이 비어 있거나 공백만 있으면 필수 입력 메시지로 400 응답한다`(name: String) {
		update(hotelId, updateBody(0, "name" to name)).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to message(REQUIRED))
	}

	@Test
	fun `아이디와 이름의 최대 길이는 앞뒤 공백을 지운 값으로 세고 넘으면 최대 길이 메시지로 400 응답한다`() {
		val loginId = "$suffix@test." + "d".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH - "$suffix@test.".length)
		val name = "가".repeat(HotelAdmin.NAME_MAX_LENGTH)

		update(hotelId, updateBody(0, "name" to "${name}가")).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to maxLength(HotelAdmin.NAME_MAX_LENGTH))
		val data = update(hotelId, updateBody(0, "loginId" to " $loginId ", "name" to " $name ")).andExpectSuccess()

		assertThat(listOf(data["loginId"].stringValue(), data["name"].stringValue())).containsExactly(loginId, name)
	}

	@ParameterizedTest
	@ValueSource(strings = ["loginId", "name", "version"])
	fun `필수 항목이 없거나 null이면 필수 입력 메시지로 400 응답한다`(field: String) {
		update(hotelId, updateBody(0) - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		update(hotelId, updateBody(0, field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
	}

	@ParameterizedTest
	@MethodSource("typeMismatches")
	fun `항목에 다른 타입을 보내면 바꾸지 않고 형식 메시지로 400 응답한다`(field: String, value: Any) {
		update(hotelId, updateBody(0, field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
	}

	@Test
	fun `문서에 없는 비밀번호 항목을 보내면 알 수 없는 항목 메시지로 400 응답한다`() {
		update(hotelId, updateBody(0, "password" to "new-password-1"))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "password" to message("validation.unknown-field"))
	}

	@Test
	fun `아이디와 이름의 검증 오류를 필드마다 하나씩 함께 응답한다`() {
		update(hotelId, updateBody(0, "loginId" to "not-an-email", "name" to " "))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "loginId" to message(EMAIL), "name" to message(REQUIRED))
	}

	@Test
	fun `로그인하지 않으면 마스터 조회와 수정은 401 UNAUTHORIZED로 응답하고 바꾸지 않는다`() {
		mockMvc.get(masterPath(hotelId)).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.put(masterPath(hotelId)) { withCsrf(); jsonBody(updateBody(0, "name" to "새 이름")) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		assertUnchanged(master)
	}

	@Test
	fun `호텔 계정 역할로는 전체 어드민의 마스터 API를 쓸 수 없어 403 FORBIDDEN으로 응답한다`() {
		mockMvc.get(masterPath(hotelId)) { loggedIn(HOTEL_MASTER_ROLES) }.andExpectError(CommonErrorCode.FORBIDDEN)
		update(hotelId, updateBody(0, "name" to "새 이름"), HOTEL_MASTER_ROLES).andExpectError(CommonErrorCode.FORBIDDEN)
		assertUnchanged(master)
	}

	@Test
	fun `CSRF 토큰 없이 수정하면 403 INVALID_CSRF_TOKEN으로 응답하고 바꾸지 않는다`() {
		mockMvc.put(masterPath(hotelId)) { loggedIn(); jsonBody(updateBody(0, "name" to "새 이름")) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		assertUnchanged(master)
	}

	@Test
	fun `마스터 API 문서는 account 태그에 operation마다 낼 수 있는 호텔·계정 에러를 예시로 보여준다`() {
		val docs = apiDocs()
		val master = docs["paths"][MASTER_DOC_PATH]
		val operations = listOf(master["get"], master["put"])

		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("getHotelMaster", "updateHotelMaster")
		assertThat(operations.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("account"))
		assertThat(docs["tags"].values().single { it["name"].stringValue() == "account" }["description"].stringValue())
			.isEqualTo(message("openapi.app-admin.tag.account"))
		operations.forEach { operation ->
			assertThat(errorCodes(operation, HttpStatus.NOT_FOUND))
				.containsExactlyInAnyOrder(HotelErrorCode.HOTEL_NOT_FOUND.code, AccountErrorCode.HOTEL_MASTER_NOT_FOUND.code)
		}
		assertThat(master["get"]["responses"].propertyNames()).doesNotContain("409")
		assertThat(errorCodes(master["put"], HttpStatus.CONFLICT))
			.containsExactlyInAnyOrder(AccountErrorCode.LOGIN_ID_DUPLICATED.code, AccountErrorCode.HOTEL_ADMIN_MODIFIED.code)
	}

	@Test
	fun `마스터 응답 문서는 모든 필드가 필수이고 수정 요청 문서는 아이디의 이메일 형식과 길이, 이름 길이를 보여주며 version까지 필수다`() {
		val docs = apiDocs()
		val schemas = docs["components"]["schemas"]
		val request = schemas["AccountHotelMasterUpdateAppAdminRequest"]
		val rules = listOf("loginId", "name").associateWith { field ->
			listOf("minLength", "maxLength", "pattern").map { request["properties"][field][it]?.asString() }
		}

		assertThat(docs["paths"][MASTER_DOC_PATH]["put"]["responses"]["200"]["content"][JSON]["schema"])
			.isEqualTo(schemaRef("ApiResponseAccountHotelMasterAppAdminResponse"))
		assertThat(required(schemas["AccountHotelMasterAppAdminResponse"])).containsExactlyInAnyOrder("id", "loginId", "name", "version")
		assertThat(request["properties"].propertyNames()).containsExactlyInAnyOrder("loginId", "name", "version")
		assertThat(required(request)).containsExactlyInAnyOrder("loginId", "name", "version")
		assertThat(rules).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"loginId" to listOf("1", HotelAdmin.LOGIN_ID_MAX_LENGTH.toString(), LoginId.PATTERN),
				"name" to listOf("1", HotelAdmin.NAME_MAX_LENGTH.toString(), null),
			),
		)
	}

	private fun update(hotelId: Long, body: Map<String, Any?>, roles: List<Role> = APP_ADMIN_ROLES): ResultActionsDsl =
		mockMvc.put(masterPath(hotelId)) {
			loggedIn(roles)
			withCsrf()
			jsonBody(body)
		}

	private fun MockHttpServletRequestDsl.loggedIn(roles: List<Role> = APP_ADMIN_ROLES) {
		with(user(USERNAME).roles(*roles.map { it.name }.toTypedArray()))
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
		linkedMapOf<String, Any?>("loginId" to masterLoginId, "name" to MASTER_NAME, "version" to version) + overrides

	private fun masterPath(hotelId: Long): String = "${ApiPaths.APP_ADMIN}/hotels/$hotelId/master"

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, loginId: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, PASSWORD_HASH, MASTER_NAME, role))

	private fun reload(hotelAdmin: HotelAdmin): HotelAdmin = hotelAdminRepository.findById(checkNotNull(hotelAdmin.id)).orElseThrow()

	private fun assertUnchanged(hotelAdmin: HotelAdmin) {
		val saved = reload(hotelAdmin)
		assertThat(listOf(saved.loginId, saved.name, saved.passwordHash, saved.version, saved.credentialVersion))
			.containsExactly(hotelAdmin.loginId, hotelAdmin.name, hotelAdmin.passwordHash, hotelAdmin.version, hotelAdmin.credentialVersion)
	}

	private fun <T> concurrently(request: (Int) -> T): List<T> {
		val start = CountDownLatch(1)
		val futures = (0 until CONCURRENT_REQUESTS).map { index -> executor.submit(Callable { start.await(); request(index) }) }
		start.countDown()
		return futures.map { it.get(TIMEOUT_SECONDS, TimeUnit.SECONDS) }
	}

	private fun ResultActionsDsl.andExpectSuccess(): JsonNode {
		val response = andReturn().response
		val body = json(response)
		assertThat(response.status).isEqualTo(HttpStatus.OK.value())
		assertThat(body.properties().map { it.key }).containsExactly("success", "data", "error")
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["error"].isNull).isTrue()
		return body["data"]
	}

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) =
		assertError(andReturn().response, errorCode, *fieldErrors)

	private fun assertError(response: MockHttpServletResponse, errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) {
		val body = json(response)
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().map { it["field"].stringValue() to it["message"].stringValue() }
		val expected = mapOf("success" to false, "data" to null, "error" to mapOf("code" to errorCode.code, "message" to message(errorCode.messageKey)))

		assertThat(response.status).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json(jsonMapper.writeValueAsString(expected)))
		assertThat(actualFieldErrors).containsExactlyInAnyOrder(*fieldErrors)
	}

	private fun masterJson(id: Long, loginId: String, name: String, version: Long): JsonNode =
		json(jsonMapper.writeValueAsString(linkedMapOf("id" to id, "loginId" to loginId, "name" to name, "version" to version)))

	private fun masterJson(hotelAdmin: HotelAdmin): JsonNode =
		masterJson(checkNotNull(hotelAdmin.id), hotelAdmin.loginId, hotelAdmin.name, hotelAdmin.version)

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(APP_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

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
		private const val APP_ADMIN_ME = ApiPaths.APP_ADMIN + ApiPaths.AUTH + "/me"
		private const val MASTER_DOC_PATH = ApiPaths.APP_ADMIN + "/hotels/{hotelId}/master"
		private const val APP_ADMIN_DOCS = "/v3/api-docs/app-admin"
		private const val PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val MASTER_NAME = "마스터"
		private const val USERNAME = "tester"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val REQUIRED = "validation.required"
		private const val TYPE = "validation.type"
		private const val MAX_LENGTH = "validation.max-length"
		private const val EMAIL = "validation.email"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val CONCURRENT_REQUESTS = 2
		private const val TIMEOUT_SECONDS = 10L
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private val APP_ADMIN_ROLES = listOf(Role.APP_ADMIN)
		private val HOTEL_MASTER_ROLES = listOf(Role.HOTEL_ADMIN, Role.HOTEL_MASTER)

		@JvmStatic
		fun loginIdErrors(): List<Arguments> {
			val tooLong = "a".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH - "@test.local".length + 1) + "@test.local"
			return listOf(
				Arguments.of("", REQUIRED),
				Arguments.of(" \t ", REQUIRED),
				Arguments.of("　", REQUIRED),
				Arguments.of("master", EMAIL),
				Arguments.of("master@test", EMAIL),
				Arguments.of("mas ter@test.local", EMAIL),
				Arguments.of("홍길동@x.com", EMAIL),
				Arguments.of("a".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH + 1), EMAIL),
				Arguments.of(" $tooLong ", MAX_LENGTH),
			)
		}

		@JvmStatic
		fun typeMismatches(): List<Arguments> = listOf(
			Arguments.of("loginId", 123),
			Arguments.of("loginId", listOf("master@test.local")),
			Arguments.of("name", true),
			Arguments.of("version", "0"),
			Arguments.of("version", 0.5),
		)
	}
}
