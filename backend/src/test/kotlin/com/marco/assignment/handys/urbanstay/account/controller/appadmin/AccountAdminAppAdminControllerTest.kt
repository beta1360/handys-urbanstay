package com.marco.assignment.handys.urbanstay.account.controller.appadmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.common.validation.Password
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.CsvSource
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
import org.springframework.security.crypto.password.PasswordEncoder
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
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class AccountAdminAppAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	private val executor = Executors.newFixedThreadPool(CONCURRENT_REQUESTS)

	private val suffix = UUID.randomUUID().toString().take(8)
	private val adminLoginId = "admin-$suffix@test.local"

	private val xsrf: Cookie by lazy { checkNotNull(mockMvc.get(APP_ADMIN_ME).andReturn().response.getCookie(XSRF_COOKIE)) }

	@AfterEach
	fun deleteAdmins() {
		executor.shutdownNow()
		jdbcTemplate.update(DELETE_ADMINS, "%-$suffix@test.local")
	}

	@Test
	fun `어드민을 추가하면 아이디는 소문자, 이름은 앞뒤 공백을 지워 저장하고 비밀번호는 입력한 그대로 해시해 version 0으로 201 응답한다`() {
		val password = " New pass 1 "

		val data = create(createBody("loginId" to " New-Admin-$suffix@Test.LOCAL\t", "name" to " 김어드민 ", "password" to password))
			.andExpectSuccess(HttpStatus.CREATED, "success.app-admin.created")

		val saved = appAdminRepository.findById(data["id"].longValue()).orElseThrow()
		assertThat(listOf(saved.loginId, saved.name, saved.version)).containsExactly("new-admin-$suffix@test.local", "김어드민", 0L)
		assertThat(data.propertyNames()).containsExactly("id", "loginId", "name", "createdAt", "version")
		assertThat(listOf(data["loginId"].stringValue(), data["name"].stringValue(), data["version"].longValue()))
			.containsExactly("new-admin-$suffix@test.local", "김어드민", 0L)
		assertThat(Instant.parse(data["createdAt"].stringValue())).isCloseTo(saved.createdAt, within(1, ChronoUnit.MILLIS))
		assertThat(passwordEncoder.matches(password, saved.passwordHash)).isTrue()
		assertThat(passwordEncoder.matches(password.trim(), saved.passwordHash)).isFalse()
	}

	@Test
	fun `추가한 어드민을 조회하면 비밀번호 없이 아이디, 이름, 추가한 시각, version을 200으로 응답한다`() {
		val id = create(createBody()).andExpectSuccess(HttpStatus.CREATED, "success.app-admin.created")["id"].longValue()

		val data = getAdmin(id).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(detailJson(reload(id)))
		assertThat(listOf(data["loginId"].stringValue(), data["name"].stringValue(), data["version"].longValue()))
			.containsExactly(adminLoginId, ADMIN_NAME, 0L)
	}

	@ParameterizedTest
	@ValueSource(strings = ["admin-%s@test.local", " ADMIN-%s@Test.Local "])
	fun `아이디를 다른 어드민이 쓰고 있으면 대소문자와 앞뒤 공백과 관계없이 409 LOGIN_ID_DUPLICATED로 응답하고 추가하지 않는다`(loginId: String) {
		saveAdmin()
		val before = adminIds()

		create(createBody("loginId" to loginId.format(suffix))).andExpectError(AccountErrorCode.LOGIN_ID_DUPLICATED)

		assertThat(adminIds()).isEqualTo(before)
	}

	@Test
	fun `같은 아이디로 동시에 추가하면 하나만 201로 추가되고 나머지는 409 LOGIN_ID_DUPLICATED로 응답한다`() {
		val responses = concurrently { index -> create(createBody("name" to "동시 추가 $index")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.CREATED.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, AccountErrorCode.LOGIN_ID_DUPLICATED)
		val winner = json(responses.single { it.status == HttpStatus.CREATED.value() })["data"]
		assertThat(adminIds()).containsExactly(winner["id"].longValue())
	}

	@ParameterizedTest
	@MethodSource("loginIdErrors")
	fun `아이디는 앞뒤 공백을 지운 뒤 빈 값, 이메일 형식, 길이 순으로 오류 하나만 응답하고 추가하지 않는다`(loginId: String, messageKey: String) {
		val expected = if (messageKey == MAX_LENGTH) maxLength(AppAdmin.LOGIN_ID_MAX_LENGTH) else message(messageKey)

		create(createBody("loginId" to loginId)).andExpectError(CommonErrorCode.INVALID_INPUT, "loginId" to expected)
		assertThat(adminIds()).isEmpty()
	}

	@Test
	fun `이름은 앞뒤 공백을 지운 뒤 비면 필수 입력, 50자를 넘으면 최대 길이 메시지로 400 응답한다`() {
		val name = "가".repeat(AppAdmin.NAME_MAX_LENGTH)

		create(createBody("name" to "　")).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to message(REQUIRED))
		create(createBody("name" to "${name}가")).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to maxLength(AppAdmin.NAME_MAX_LENGTH))
		val data = create(createBody("name" to " $name ")).andExpectSuccess(HttpStatus.CREATED, "success.app-admin.created")

		assertThat(data["name"].stringValue()).isEqualTo(name)
	}

	@ParameterizedTest
	@CsvSource(
		"'        ', validation.required",
		"abcdefgh, validation.password",
		"12345678, validation.password",
		"abc1234, validation.password",
		"비밀번호abc123, validation.password",
	)
	fun `비밀번호는 비면 필수 입력, 규칙을 어기면 비밀번호 규칙 메시지 하나로 400 응답하고 추가하지 않는다`(password: String, messageKey: String) {
		create(createBody("password" to password)).andExpectError(CommonErrorCode.INVALID_INPUT, "password" to message(messageKey))
		assertThat(adminIds()).isEmpty()
	}

	@ParameterizedTest
	@ValueSource(strings = ["loginId", "name", "password"])
	fun `필수 항목이 없거나 null이면 필수 입력 메시지로 400 응답한다`(field: String) {
		create(createBody() - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		create(createBody(field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
	}

	@Test
	fun `아이디, 이름, 비밀번호의 검증 오류를 필드마다 하나씩 함께 응답하고 문서에 없는 항목은 알 수 없는 항목 메시지로 400 응답한다`() {
		create(createBody("loginId" to "not-an-email", "name" to " ", "password" to "short"))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "loginId" to message(EMAIL), "name" to message(REQUIRED), "password" to message(PASSWORD))
		create(createBody("version" to 0)).andExpectError(CommonErrorCode.INVALID_INPUT, "version" to message(UNKNOWN_FIELD))
		assertThat(adminIds()).isEmpty()
	}

	@Test
	fun `없는 id로 조회하거나 수정하면 404 APP_ADMIN_NOT_FOUND로 응답한다`() {
		getAdmin(MISSING_ID).andExpectError(AccountErrorCode.APP_ADMIN_NOT_FOUND)
		update(MISSING_ID, updateBody(0)).andExpectError(AccountErrorCode.APP_ADMIN_NOT_FOUND)
	}

	@Test
	fun `조회한 version으로 이름을 바꾸면 앞뒤 공백을 지워 저장하고 version을 올려 200으로 응답하며 아이디와 비밀번호는 그대로이고 내 정보 조회도 바뀐 이름이다`() {
		val admin = saveAdmin()

		val data = update(admin.id!!, updateBody(0, "name" to " 새 이름 ")).andExpectSuccess(HttpStatus.OK, "success.app-admin.updated")

		val saved = reload(admin.id!!)
		assertThat(data).isEqualTo(detailJson(saved))
		assertThat(listOf(saved.loginId, saved.name, saved.passwordHash, saved.version))
			.containsExactly(admin.loginId, "새 이름", admin.passwordHash, 1L)
		val me = json(mockMvc.get(APP_ADMIN_ME) { with(user(admin.loginId).roles(Role.APP_ADMIN.name)) }.andReturn().response)
		assertThat(me["data"]["name"].stringValue()).isEqualTo("새 이름")
	}

	@Test
	fun `바뀐 값이 없는 수정은 version을 올리지 않고 200으로 응답한다`() {
		val admin = saveAdmin()

		val data = update(admin.id!!, updateBody(0, "name" to " $ADMIN_NAME ")).andExpectSuccess(HttpStatus.OK, "success.app-admin.updated")

		assertThat(data["version"].longValue()).isZero()
		assertThat(reload(admin.id!!).version).isZero()
	}

	@Test
	fun `같은 version으로 두 번 수정하면 먼저 수정한 쪽만 반영되고 나중 쪽은 409 APP_ADMIN_MODIFIED로 응답한다`() {
		val admin = saveAdmin()

		update(admin.id!!, updateBody(0, "name" to "먼저 수정")).andExpectSuccess(HttpStatus.OK, "success.app-admin.updated")
		update(admin.id!!, updateBody(0, "name" to "나중 수정")).andExpectError(AccountErrorCode.APP_ADMIN_MODIFIED)

		val saved = reload(admin.id!!)
		assertThat(listOf(saved.name, saved.version)).containsExactly("먼저 수정", 1L)
	}

	@Test
	fun `같은 version으로 동시에 수정하면 하나만 200으로 반영되고 나머지는 409 APP_ADMIN_MODIFIED로 응답한다`() {
		val admin = saveAdmin()

		val responses = concurrently { index -> update(admin.id!!, updateBody(0, "name" to "동시 수정 $index")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.OK.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, AccountErrorCode.APP_ADMIN_MODIFIED)
		val winner = json(responses.single { it.status == HttpStatus.OK.value() })["data"]
		assertThat(detailJson(reload(admin.id!!))).isEqualTo(winner)
		assertThat(winner["version"].longValue()).isEqualTo(1)
	}

	@Test
	fun `수정 요청의 이름이 비거나 50자를 넘거나, 필수 항목이 없거나, 아이디나 비밀번호를 보내면 400 응답하고 바꾸지 않는다`() {
		val admin = saveAdmin()

		update(admin.id!!, updateBody(0, "name" to "　")).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to message(REQUIRED))
		update(admin.id!!, updateBody(0, "name" to " ${"가".repeat(AppAdmin.NAME_MAX_LENGTH + 1)} "))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "name" to maxLength(AppAdmin.NAME_MAX_LENGTH))
		listOf("name", "version").forEach { field ->
			update(admin.id!!, updateBody(0) - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
			update(admin.id!!, updateBody(0, field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		}
		update(admin.id!!, updateBody(0, "version" to "0")).andExpectError(CommonErrorCode.INVALID_INPUT, "version" to message(TYPE))
		listOf("loginId", "password").forEach { field ->
			update(admin.id!!, updateBody(0, field to "x")).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(UNKNOWN_FIELD))
		}
		val saved = reload(admin.id!!)
		assertThat(listOf(saved.name, saved.version)).containsExactly(ADMIN_NAME, 0L)
	}

	@Test
	fun `목록은 기본값 page 0, size 10으로 최근 추가 순으로 조회하고 version은 주지 않는다`() {
		val ids = saveAdmins(11)

		val data = getAdmins().andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.reversed().take(10))
		assertThat(data["items"][0]).isEqualTo(listJson(reload(ids.last())))
		assertThat(data["items"][0].propertyNames()).containsExactly("id", "loginId", "name", "createdAt")
		val total = appAdminRepository.count()
		assertThat(pageInfo(data)).containsExactly(0, 10, total, (total + 9) / 10)
	}

	@Test
	fun `page와 size로 원하는 페이지를 조회한다`() {
		val ids = saveAdmins(7)

		val data = getAdmins("page" to "1", "size" to "3").andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.reversed().subList(3, 6))
		assertThat(pageInfo(data).take(2)).containsExactly(1, 3)
	}

	@ParameterizedTest
	@CsvSource(
		"page, -1, validation.min, 0",
		"page, 100, validation.max, 99",
		"size, 0, validation.min, 1",
		"size, 101, validation.max, 100",
	)
	fun `범위를 벗어난 page와 size는 파라미터 이름과 범위 메시지로 400 응답한다`(parameter: String, value: String, messageKey: String, bound: String) {
		getAdmins(parameter to value).andExpectError(CommonErrorCode.INVALID_INPUT, parameter to message(messageKey).replace("{value}", bound))
	}

	@Test
	fun `로그인하지 않으면 401, 호텔 계정 역할이면 403, CSRF 토큰이 없으면 403 INVALID_CSRF_TOKEN으로 응답하고 바꾸지 않는다`() {
		val admin = saveAdmin()
		val newAdmin = createBody("loginId" to "new-$suffix@test.local")

		mockMvc.get(ADMINS).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get("$ADMINS/${admin.id}").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.post(ADMINS) { withCsrf(); jsonBody(newAdmin) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.put("$ADMINS/${admin.id}") { withCsrf(); jsonBody(updateBody(0)) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		listOf(Role.HOTEL_ADMIN, Role.HOTEL_MASTER).forEach { role ->
			getAdmins(role = role).andExpectError(CommonErrorCode.FORBIDDEN)
			getAdmin(admin.id!!, role).andExpectError(CommonErrorCode.FORBIDDEN)
			create(newAdmin, role).andExpectError(CommonErrorCode.FORBIDDEN)
			update(admin.id!!, updateBody(0, "name" to "새 이름"), role).andExpectError(CommonErrorCode.FORBIDDEN)
		}
		mockMvc.post(ADMINS) { with(appAdmin()); jsonBody(newAdmin) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		mockMvc.put("$ADMINS/${admin.id}") { with(appAdmin()); jsonBody(updateBody(0, "name" to "새 이름")) }
			.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		assertThat(adminIds()).containsExactly(admin.id)
		assertThat(reload(admin.id!!).name).isEqualTo(ADMIN_NAME)
	}

	@Test
	fun `어드민 계정 API 문서는 account 태그의 operation과 낼 수 있는 계정 에러, 응답 스키마를 보여준다`() {
		val docs = apiDocs()
		val admins = docs["paths"][ADMINS]
		val admin = docs["paths"]["$ADMINS/{adminId}"]
		val operations = listOf(admins["get"], admin["get"], admins["post"], admin["put"])

		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("getAdmins", "getAdmin", "createAdmin", "updateAdmin")
		assertThat(operations.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("account"))
		assertThat(admins["get"]["parameters"].values().map { it["name"].stringValue() }).containsExactly("page", "size")
		assertThat(admins["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(admins["post"]["responses"].propertyNames()).containsExactlyInAnyOrder("201", "400", "401", "403", "409", "500")
		assertThat(errorCodes(admins["post"], HttpStatus.CONFLICT)).containsExactly(AccountErrorCode.LOGIN_ID_DUPLICATED.code)
		listOf(admin["get"], admin["put"]).forEach { op ->
			assertThat(errorCodes(op, HttpStatus.NOT_FOUND)).containsExactly(AccountErrorCode.APP_ADMIN_NOT_FOUND.code)
		}
		assertThat(admin["get"]["responses"].propertyNames()).doesNotContain("409")
		assertThat(errorCodes(admin["put"], HttpStatus.CONFLICT)).containsExactly(AccountErrorCode.APP_ADMIN_MODIFIED.code)
		assertThat(admins["get"]["responses"]["200"]["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponsePageResponseAccountAdminAppAdminResponse"))
		listOf(admin["get"]["responses"]["200"], admins["post"]["responses"]["201"], admin["put"]["responses"]["200"]).forEach {
			assertThat(it["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponseAccountAdminDetailAppAdminResponse"))
		}
	}

	@Test
	fun `응답 문서는 모든 필드가 필수이고 요청 문서는 필수 항목과 아이디 형식과 길이, 이름 길이, 비밀번호 규칙을 보여준다`() {
		val schemas = apiDocs()["components"]["schemas"]
		val loginId = listOf("1", AppAdmin.LOGIN_ID_MAX_LENGTH.toString(), LoginId.PATTERN)
		val name = listOf("1", AppAdmin.NAME_MAX_LENGTH.toString(), null)
		val password = listOf(Password.MIN_LENGTH.toString(), Password.MAX_LENGTH.toString(), Password.PATTERN)
		val requests = mapOf(
			"AccountAdminCreateAppAdminRequest" to mapOf("loginId" to loginId, "name" to name, "password" to password),
			"AccountAdminUpdateAppAdminRequest" to mapOf("name" to name, "version" to listOf(null, null, null)),
		)

		assertThat(required(schemas["AccountAdminAppAdminResponse"])).containsExactlyInAnyOrder("id", "loginId", "name", "createdAt")
		assertThat(required(schemas["AccountAdminDetailAppAdminResponse"])).containsExactlyInAnyOrder("id", "loginId", "name", "createdAt", "version")
		assertThat(schemas["AccountAdminDetailAppAdminResponse"]["properties"]["createdAt"]["format"].stringValue()).isEqualTo("date-time")
		requests.forEach { (schemaName, rules) ->
			val request = schemas[schemaName]
			val actual = rules.keys.associateWith { field -> listOf("minLength", "maxLength", "pattern").map { request["properties"][field][it]?.asString() } }
			assertThat(request["properties"].propertyNames()).describedAs(schemaName).containsExactlyInAnyOrderElementsOf(rules.keys)
			assertThat(required(request)).describedAs(schemaName).containsExactlyInAnyOrderElementsOf(rules.keys)
			assertThat(actual).describedAs(schemaName).containsExactlyInAnyOrderEntriesOf(rules)
		}
	}

	private fun appAdmin() = user(USERNAME).roles(Role.APP_ADMIN.name)

	private fun create(body: Map<String, Any?>, role: Role = Role.APP_ADMIN): ResultActionsDsl =
		mockMvc.post(ADMINS) {
			with(user(USERNAME).roles(role.name))
			withCsrf()
			jsonBody(body)
		}

	private fun getAdmins(vararg params: Pair<String, String>, role: Role = Role.APP_ADMIN): ResultActionsDsl =
		mockMvc.get(ADMINS) {
			with(user(USERNAME).roles(role.name))
			params.forEach { (name, value) -> param(name, value) }
		}

	private fun getAdmin(id: Long, role: Role = Role.APP_ADMIN): ResultActionsDsl =
		mockMvc.get("$ADMINS/$id") { with(user(USERNAME).roles(role.name)) }

	private fun update(id: Long, body: Map<String, Any?>, role: Role = Role.APP_ADMIN): ResultActionsDsl =
		mockMvc.put("$ADMINS/$id") {
			with(user(USERNAME).roles(role.name))
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

	private fun createBody(vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>("loginId" to adminLoginId, "name" to ADMIN_NAME, "password" to NEW_PASSWORD) + overrides

	private fun updateBody(version: Long, vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>("name" to ADMIN_NAME, "version" to version) + overrides

	private fun saveAdmin(loginId: String = adminLoginId, name: String = ADMIN_NAME): AppAdmin =
		appAdminRepository.save(AppAdmin(loginId, PASSWORD_HASH, name))

	private fun saveAdmins(count: Int): List<Long> = (1..count).map { checkNotNull(saveAdmin("list-$it-$suffix@test.local", "목록 $it").id) }

	private fun reload(id: Long): AppAdmin = appAdminRepository.findById(id).orElseThrow()

	private fun adminIds(): List<Long> =
		jdbcTemplate.queryForList(SELECT_ADMIN_IDS, Long::class.javaObjectType, "%-$suffix@test.local").filterNotNull()

	private fun <T> concurrently(request: (Int) -> T): List<T> {
		val start = CountDownLatch(1)
		val futures = (0 until CONCURRENT_REQUESTS).map { index -> executor.submit(Callable { start.await(); request(index) }) }
		start.countDown()
		return futures.map { it.get(TIMEOUT_SECONDS, TimeUnit.SECONDS) }
	}

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus, messageKey: String? = null): JsonNode {
		val response = andReturn().response
		val body = json(response)
		assertThat(response.status).isEqualTo(status.value())
		assertThat(body.propertyNames()).containsExactly("success", "data", "message", "error")
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].stringValue(null)).isEqualTo(messageKey?.let(::message))
		assertThat(body["error"].isNull).isTrue()
		return body["data"]
	}

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) =
		assertError(andReturn().response, errorCode, *fieldErrors)

	private fun assertError(response: MockHttpServletResponse, errorCode: ErrorCode, vararg fieldErrors: Pair<String, String>) {
		val body = json(response)
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().map { it["field"].stringValue() to it["message"].stringValue() }
		val expected = mapOf("success" to false, "data" to null, "message" to null, "error" to mapOf("code" to errorCode.code, "message" to message(errorCode.messageKey)))

		assertThat(response.status).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json(jsonMapper.writeValueAsString(expected)))
		assertThat(actualFieldErrors).containsExactlyInAnyOrder(*fieldErrors)
	}

	private fun listJson(admin: AppAdmin): JsonNode =
		json(jsonMapper.writeValueAsString(linkedMapOf("id" to admin.id, "loginId" to admin.loginId, "name" to admin.name, "createdAt" to admin.createdAt)))

	private fun detailJson(admin: AppAdmin): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf("id" to admin.id, "loginId" to admin.loginId, "name" to admin.name, "createdAt" to admin.createdAt, "version" to admin.version),
			),
		)

	private fun itemIds(data: JsonNode): List<Long> = data["items"].values().map { it["id"].longValue() }

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

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
		private const val ADMINS = ApiPaths.APP_ADMIN + ApiPaths.ADMINS
		private const val APP_ADMIN_ME = ApiPaths.APP_ADMIN + ApiPaths.AUTH + "/me"
		private const val APP_ADMIN_DOCS = "/v3/api-docs/app-admin"
		private const val PASSWORD_HASH = "password-hash"
		private const val ADMIN_NAME = "어드민"
		private const val USERNAME = "tester"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val REQUIRED = "validation.required"
		private const val TYPE = "validation.type"
		private const val UNKNOWN_FIELD = "validation.unknown-field"
		private const val MAX_LENGTH = "validation.max-length"
		private const val EMAIL = "validation.email"
		private const val PASSWORD = "validation.password"
		private const val NEW_PASSWORD = "new-password-1"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val CONCURRENT_REQUESTS = 2
		private const val TIMEOUT_SECONDS = 10L
		private const val DELETE_ADMINS = "delete from app_admin where login_id like ?"
		private const val SELECT_ADMIN_IDS = "select id from app_admin where login_id like ? order by id"

		@JvmStatic
		fun loginIdErrors(): List<Arguments> {
			val tooLong = "a".repeat(AppAdmin.LOGIN_ID_MAX_LENGTH - "@test.local".length + 1) + "@test.local"
			return listOf(
				Arguments.of("", REQUIRED),
				Arguments.of(" \t ", REQUIRED),
				Arguments.of("admin", EMAIL),
				Arguments.of("admin@test", EMAIL),
				Arguments.of("홍길동@x.com", EMAIL),
				Arguments.of(" $tooLong ", MAX_LENGTH),
			)
		}
	}
}
