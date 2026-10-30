package com.marco.assignment.handys.urbanstay.account.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import com.marco.assignment.handys.urbanstay.hotel.service.HotelService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.crypto.password.PasswordEncoder
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.node.ObjectNode
import java.net.HttpCookie
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.Locale
import java.util.UUID

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class AccountHotelAdminControllerTest {

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

	@Autowired
	private lateinit var hotelService: HotelService

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@LocalServerPort
	private var port: Int = 0

	private val httpClient = HttpClient.newHttpClient()

	private val suffix = UUID.randomUUID().toString().take(8)
	private val masterLoginId = "master-$suffix@test.local"
	private val operatorLoginId = "operator-$suffix@test.local"

	private lateinit var hotel: Hotel

	private lateinit var master: HotelAdmin

	private lateinit var operator: HotelAdmin

	private val createdHotelIds = mutableListOf<Long>()

	private val createdAppAdminIds = mutableListOf<Long>()

	@BeforeEach
	fun createAccounts() {
		hotel = saveHotel("어반스테이 $suffix")
		master = saveHotelAdmin(masterLoginId, MASTER_NAME, HotelAdminRole.MASTER, PASSWORD)
		operator = saveHotelAdmin(operatorLoginId, OPERATOR_NAME, HotelAdminRole.OPERATOR, PASSWORD)
	}

	@AfterEach
	fun deleteAccounts() {
		createdHotelIds.forEach { jdbcTemplate.update(DELETE_HOTEL_ADMINS, it) }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
		appAdminRepository.deleteAllByIdInBatch(createdAppAdminIds)
	}

	@Test
	fun `로그인하지 않고 내 정보를 조회하면 401과 함께 XSRF-TOKEN 쿠키를 받고 세션은 만들지 않는다`() {
		val browser = Browser()

		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertThat(browser.cookie(XSRF_COOKIE)).isNotBlank()
		assertThat(browser.cookie(SESSION_COOKIE)).isNull()
	}

	@Test
	fun `CSRF 토큰 없이 로그인하면 403 INVALID_CSRF_TOKEN으로 응답한다`() {
		assertError(Browser().post(LOGIN, loginBody(masterLoginId, PASSWORD)), CommonErrorCode.INVALID_CSRF_TOKEN)
	}

	@Test
	fun `마스터로 로그인하면 계정과 호텔 정보와 세션을 주고 XSRF-TOKEN을 새로 발급해 이전 토큰을 거절한다`() {
		val browser = Browser().withXsrfToken()
		val oldToken = checkNotNull(browser.cookie(XSRF_COOKIE))

		val response = browser.post(LOGIN, loginBody(masterLoginId, PASSWORD))

		assertSuccess(response, hotelAdminJson(master, "MASTER"))
		assertThat(browser.cookie(SESSION_COOKIE)).isNotBlank()
		assertThat(browser.cookie(XSRF_COOKIE)).isNotBlank().isNotEqualTo(oldToken)
		assertError(browser.post(LOGOUT, xsrfHeader = oldToken), CommonErrorCode.INVALID_CSRF_TOKEN)
		assertSuccess(browser.get(ME), hotelAdminJson(master, "MASTER"))
	}

	@Test
	fun `운영자로 로그인하면 역할이 OPERATOR인 계정 정보를 준다`() {
		val browser = loggedIn(operatorLoginId)

		assertSuccess(browser.get(ME), hotelAdminJson(operator, "OPERATOR"))
	}

	@ParameterizedTest
	@ValueSource(strings = ["wrong-password", "unknown-login", "inactive"])
	fun `아이디가 없거나 비밀번호가 틀리거나 비활성 계정이면 같은 401 INVALID_CREDENTIALS로 응답하고 세션을 만들지 않는다`(case: String) {
		val loginId = if (case == "unknown-login") "unknown-$suffix@test.local" else operatorLoginId
		val password = if (case == "wrong-password") "wrong-password-1" else PASSWORD
		if (case == "inactive") {
			jdbcTemplate.update(DEACTIVATE, operator.id)
		}
		val browser = Browser().withXsrfToken()

		assertError(browser.post(LOGIN, loginBody(loginId, password)), AccountErrorCode.INVALID_CREDENTIALS)
		assertThat(browser.cookie(SESSION_COOKIE)).isNull()
	}

	@ParameterizedTest
	@ValueSource(strings = [" Master-%s@TEST.local ", "MASTER-%s@test.local"])
	fun `대소문자와 앞뒤 공백이 다른 아이디로도 로그인한다`(loginId: String) {
		assertSuccess(Browser().withXsrfToken().post(LOGIN, loginBody(loginId.format(suffix), PASSWORD)), hotelAdminJson(master, "MASTER"))
	}

	@Test
	fun `비밀번호는 앞뒤 공백을 지우지 않고 입력한 그대로 비교한다`() {
		val spaced = saveHotelAdmin("spaced-$suffix@test.local", OPERATOR_NAME, HotelAdminRole.OPERATOR, " spaced pass 1 ")

		assertSuccess(Browser().withXsrfToken().post(LOGIN, loginBody(spaced.loginId, " spaced pass 1 ")), hotelAdminJson(spaced, "OPERATOR"))
		listOf("spaced pass 1", " spaced pass 1", "spaced pass 1 ", "  spaced pass 1  ").forEach { password ->
			assertError(Browser().withXsrfToken().post(LOGIN, loginBody(spaced.loginId, password)), AccountErrorCode.INVALID_CREDENTIALS)
		}
	}

	@Test
	fun `호텔 등록으로 만든 마스터는 영문 자판 글자로만 된 64자 비밀번호로 로그인한다`() {
		val password = " 1aZ!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" + "x".repeat(28)
		val created = hotelService.create(
			name = "등록 호텔 $suffix",
			address = "서울 $suffix",
			phone = PHONE,
			description = null,
			masterLoginId = "created-$suffix@test.local",
			masterName = MASTER_NAME,
			masterPassword = password,
		)
		createdHotelIds += checkNotNull(created.id)

		val data = json(Browser().withXsrfToken().post(LOGIN, loginBody("created-$suffix@test.local", password)).body())["data"]

		assertThat(password).hasSize(64)
		assertThat(data["role"].stringValue()).isEqualTo("MASTER")
		assertThat(data["hotel"]).isEqualTo(json("""{"id":${created.id},"name":"등록 호텔 $suffix"}"""))
	}

	@Test
	fun `빈 아이디와 비밀번호는 필드마다 필수 입력 메시지와 함께 400으로 응답한다`() {
		val required = message("validation.required")

		assertError(
			Browser().withXsrfToken().post(LOGIN, loginBody(" ", "")),
			CommonErrorCode.INVALID_INPUT,
			mapOf("loginId" to required, "password" to required),
		)
	}

	@Test
	fun `문서에 없는 필드를 보내면 로그인하지 않고 알 수 없는 항목 메시지와 함께 400으로 응답한다`() {
		val browser = Browser().withXsrfToken()
		val body = jsonMapper.writeValueAsString(mapOf("loginId" to masterLoginId, "password" to PASSWORD, "hotelId" to 1))

		assertError(browser.post(LOGIN, body), CommonErrorCode.INVALID_INPUT, mapOf("hotelId" to message("validation.unknown-field")))
		assertThat(browser.cookie(SESSION_COOKIE)).isNull()
	}

	@Test
	fun `내 정보는 로그인할 때가 아니라 지금 저장된 이름과 호텔 이름으로 응답한다`() {
		val browser = loggedIn(masterLoginId)

		jdbcTemplate.update("update hotel_admin set name = ? where id = ?", "새 이름", master.id)
		jdbcTemplate.update("update hotel set name = ? where id = ?", "새 호텔 $suffix", hotel.id)

		val data = json(browser.get(ME).body())["data"]
		assertThat(listOf(data["name"].stringValue(), data["hotel"]["name"].stringValue())).containsExactly("새 이름", "새 호텔 $suffix")
	}

	@Test
	fun `같은 이메일의 전체 어드민과 호텔 계정은 각자 비밀번호로 각자 앱에만 로그인한다`() {
		val appAdminPassword = "app-admin-password-1"
		createdAppAdminIds += checkNotNull(appAdminRepository.save(AppAdmin(masterLoginId, checkNotNull(passwordEncoder.encode(appAdminPassword)), "어드민")).id)

		assertError(Browser().withXsrfToken().post(LOGIN, loginBody(masterLoginId, appAdminPassword)), AccountErrorCode.INVALID_CREDENTIALS)
		assertError(appAdminBrowser().post(APP_ADMIN_LOGIN, loginBody(masterLoginId, PASSWORD)), AccountErrorCode.INVALID_CREDENTIALS)
		assertSuccess(Browser().withXsrfToken().post(LOGIN, loginBody(masterLoginId, PASSWORD)), hotelAdminJson(master, "MASTER"))
		assertThat(appAdminBrowser().post(APP_ADMIN_LOGIN, loginBody(masterLoginId, appAdminPassword)).statusCode()).isEqualTo(HttpStatus.OK.value())
	}

	@Test
	fun `호텔 계정으로는 전체 어드민 앱에 로그인할 수 없고 호텔 계정 세션으로 전체 어드민 API를 요청하면 403 FORBIDDEN으로 응답한다`() {
		assertError(appAdminBrowser().post(APP_ADMIN_LOGIN, loginBody(masterLoginId, PASSWORD)), AccountErrorCode.INVALID_CREDENTIALS)
		assertError(loggedIn(masterLoginId).get(ApiPaths.APP_ADMIN + ApiPaths.AUTH + "/me"), CommonErrorCode.FORBIDDEN)
	}

	@Test
	fun `로그아웃하면 세션을 끝내고 세션 쿠키와 XSRF-TOKEN 쿠키를 지운다`() {
		val browser = loggedIn(masterLoginId)
		val session = checkNotNull(browser.cookie(SESSION_COOKIE))

		val response = browser.post(LOGOUT)

		assertSuccess(response, "null")
		assertThat(expiredCookies(response)).contains(SESSION_COOKIE, XSRF_COOKIE)
		assertThat(browser.cookie(SESSION_COOKIE)).isNull()
		assertThat(browser.cookie(XSRF_COOKIE)).isNull()
		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(Browser(SESSION_COOKIE to session).get(ME), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `로그인하지 않고 CSRF 토큰과 함께 로그아웃하면 401 UNAUTHORIZED로 응답한다`() {
		assertError(Browser().withXsrfToken().post(LOGOUT), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `로그인한 뒤 계정이 비활성화되면 다음 요청은 401 UNAUTHORIZED이고 세션이 끊겨 다시 활성화돼도 그 세션은 쓸 수 없다`() {
		val browser = loggedIn(operatorLoginId)

		jdbcTemplate.update(DEACTIVATE, operator.id)
		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)

		jdbcTemplate.update("update hotel_admin set active = true where id = ?", operator.id)
		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertSuccess(browser.post(LOGIN, loginBody(operatorLoginId, PASSWORD)), hotelAdminJson(operator, "OPERATOR"))
		assertSuccess(browser.get(ME), hotelAdminJson(operator, "OPERATOR"))
	}

	@Test
	fun `로그인한 뒤 로그인 정보 버전이 바뀌면 다음 요청은 401 UNAUTHORIZED이고 다시 로그인하면 새 버전으로 쓸 수 있다`() {
		val browser = loggedIn(masterLoginId)

		jdbcTemplate.update(INCREASE_CREDENTIAL_VERSION, master.id)
		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)

		assertSuccess(browser.post(LOGIN, loginBody(masterLoginId, PASSWORD)), hotelAdminJson(master, "MASTER"))
		assertSuccess(browser.get(ME), hotelAdminJson(master, "MASTER"))
	}

	@Test
	fun `로그인한 계정이 없어지면 다음 요청은 401 UNAUTHORIZED로 응답한다`() {
		val browser = loggedIn(operatorLoginId)

		jdbcTemplate.update("delete from hotel_admin where id = ?", operator.id)

		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `이름만 바뀌면 세션을 유지하고 내 정보에 새 이름을 준다`() {
		val browser = loggedIn(masterLoginId)

		jdbcTemplate.update("update hotel_admin set name = ? where id = ?", "바뀐 이름", master.id)

		repeat(2) { assertThat(json(browser.get(ME).body())["data"]["name"].stringValue()).isEqualTo("바뀐 이름") }
		assertSuccess(browser.post(LOGOUT), "null")
	}

	@Test
	fun `정상 계정의 세션은 요청마다 확인해도 계속 쓸 수 있고 다른 계정이 비활성화돼도 영향을 받지 않는다`() {
		val masterBrowser = loggedIn(masterLoginId)
		val operatorBrowser = loggedIn(operatorLoginId)

		jdbcTemplate.update(DEACTIVATE, operator.id)

		repeat(3) { assertSuccess(masterBrowser.get(ME), hotelAdminJson(master, "MASTER")) }
		assertError(operatorBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `끊긴 세션의 로그아웃은 CSRF 토큰이 맞으면 401 UNAUTHORIZED, 없으면 CSRF 검사가 먼저라 403 INVALID_CSRF_TOKEN이다`() {
		val browser = loggedIn(operatorLoginId)

		jdbcTemplate.update(DEACTIVATE, operator.id)

		assertError(browser.post(LOGOUT, xsrfHeader = null), CommonErrorCode.INVALID_CSRF_TOKEN)
		assertError(browser.post(LOGOUT), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `끊긴 세션 쿠키만 보낸 요청의 401 응답은 로그인하지 않은 요청처럼 XSRF-TOKEN 쿠키를 발급하고 세션 쿠키는 만들지 않는다`() {
		val session = checkNotNull(loggedIn(operatorLoginId).cookie(SESSION_COOKIE))
		jdbcTemplate.update(DEACTIVATE, operator.id)

		val response = Browser(SESSION_COOKIE to session).get(ME)

		assertError(response, CommonErrorCode.UNAUTHORIZED)
		assertThat(setCookies(response).map { it.name }).containsExactly(XSRF_COOKIE)
	}

	@Test
	fun `API 문서는 hotel-admin 그룹의 account 태그에 로그인·로그아웃·내 정보를 열린 로그인과 함께 보여준다`() {
		val docs = json(Browser().get(HOTEL_ADMIN_DOCS).body())
		val auth = listOf(LOGIN to "post", LOGOUT to "post", ME to "get").associate { (path, method) -> path to docs["paths"][path][method] }
		val schemas = docs["components"]["schemas"]
		val response = schemas["AccountHotelAdminResponse"]

		assertThat(auth.values.map { it["operationId"].stringValue() }).containsExactly("login", "logout", "getMe")
		assertThat(auth.values.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("account"))
		assertThat(auth.getValue(LOGIN)["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(errorCode(auth.getValue(LOGIN), HttpStatus.UNAUTHORIZED)).isEqualTo(AccountErrorCode.INVALID_CREDENTIALS.code)
		assertThat(errorCode(auth.getValue(LOGIN), HttpStatus.FORBIDDEN)).isEqualTo(CommonErrorCode.INVALID_CSRF_TOKEN.code)
		assertThat(errorCode(auth.getValue(ME), HttpStatus.UNAUTHORIZED)).isEqualTo(CommonErrorCode.UNAUTHORIZED.code)
		assertThat(required(response)).containsExactlyInAnyOrder("id", "loginId", "name", "role", "hotel")
		assertThat(response["properties"]["role"]["enum"].values().map { it.stringValue() }).containsExactly("MASTER", "OPERATOR")
		assertThat(response["properties"]["hotel"]["\$ref"].stringValue()).isEqualTo("#/components/schemas/AccountHotelHotelAdminResponse")
		assertThat(required(schemas["AccountHotelHotelAdminResponse"])).containsExactlyInAnyOrder("id", "name")
		assertThat(required(schemas["AccountLoginHotelAdminRequest"])).containsExactlyInAnyOrder("loginId", "password")
	}

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(loginId: String, name: String, role: HotelAdminRole, password: String): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, checkNotNull(passwordEncoder.encode(password)), name, role))

	private fun loggedIn(loginId: String): Browser =
		Browser().withXsrfToken().also { assertThat(it.post(LOGIN, loginBody(loginId, PASSWORD)).statusCode()).isEqualTo(HttpStatus.OK.value()) }

	private fun appAdminBrowser(): Browser = Browser().also { it.get(ApiPaths.APP_ADMIN + ApiPaths.AUTH + "/me") }

	private fun loginBody(loginId: String, password: String): String =
		jsonMapper.writeValueAsString(mapOf("loginId" to loginId, "password" to password))

	private fun hotelAdminJson(hotelAdmin: HotelAdmin, role: String): String =
		jsonMapper.writeValueAsString(
			linkedMapOf(
				"id" to hotelAdmin.id,
				"loginId" to hotelAdmin.loginId,
				"name" to hotelAdmin.name,
				"role" to role,
				"hotel" to linkedMapOf("id" to hotel.id, "name" to hotel.name),
			),
		)

	private fun assertSuccess(response: HttpResponse<String>, data: String) {
		assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value())
		assertThat(json(response.body())).isEqualTo(json("""{"success":true,"data":$data,"message":null,"error":null}"""))
	}

	private fun assertError(response: HttpResponse<String>, errorCode: ErrorCode, fieldErrors: Map<String, String> = emptyMap()) {
		val body = json(response.body())
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().associate { it["field"].stringValue() to it["message"].stringValue() }

		assertThat(response.statusCode()).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json("""{"success":false,"data":null,"message":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode.messageKey)}"}}"""))
		assertThat(actualFieldErrors).isEqualTo(fieldErrors)
	}

	private fun errorCode(operation: JsonNode, status: HttpStatus): String =
		operation["responses"][status.value().toString()]["content"][JSON]["example"]["error"]["code"].stringValue()

	private fun required(schema: JsonNode): List<String> = schema.path("required").values().map { it.stringValue() }

	private fun expiredCookies(response: HttpResponse<String>): List<String> =
		setCookies(response).filter { it.maxAge == 0L }.map { it.name }

	private fun setCookies(response: HttpResponse<String>): List<HttpCookie> =
		response.headers().allValues(HttpHeaders.SET_COOKIE).flatMap(HttpCookie::parse)

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private inner class Browser(vararg cookies: Pair<String, String>) {

		private val cookies = linkedMapOf(*cookies)

		fun cookie(name: String): String? = cookies[name]

		fun withXsrfToken(): Browser = apply { get(ME) }

		fun get(path: String): HttpResponse<String> = send(request(path).GET())

		fun post(path: String, body: String? = null, xsrfHeader: String? = cookie(XSRF_COOKIE)): HttpResponse<String> {
			val request = request(path)
			xsrfHeader?.let { request.header(XSRF_HEADER, it) }
			if (body == null) {
				return send(request.POST(HttpRequest.BodyPublishers.noBody()))
			}
			return send(request.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).POST(HttpRequest.BodyPublishers.ofString(body)))
		}

		private fun request(path: String): HttpRequest.Builder {
			val request = HttpRequest.newBuilder(URI.create("http://localhost:$port$path"))
			if (cookies.isNotEmpty()) {
				request.header(HttpHeaders.COOKIE, cookies.entries.joinToString("; ") { "${it.key}=${it.value}" })
			}
			return request
		}

		private fun send(request: HttpRequest.Builder): HttpResponse<String> {
			val response = httpClient.send(request.build(), HttpResponse.BodyHandlers.ofString())
			setCookies(response).forEach { if (it.maxAge == 0L) cookies.remove(it.name) else cookies[it.name] = it.value }
			return response
		}
	}

	companion object {
		private const val PASSWORD = "hotel-password-1"
		private const val MASTER_NAME = "마스터"
		private const val OPERATOR_NAME = "운영자"
		private const val PHONE = "02-1234-5678"
		private const val AUTH = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH
		private const val LOGIN = AUTH + ApiPaths.LOGIN
		private const val LOGOUT = "$AUTH/logout"
		private const val ME = "$AUTH/me"
		private const val APP_ADMIN_LOGIN = ApiPaths.APP_ADMIN + ApiPaths.AUTH + ApiPaths.LOGIN
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val SESSION_COOKIE = "JSESSIONID"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val DEACTIVATE = "update hotel_admin set active = false where id = ?"
		private const val INCREASE_CREDENTIAL_VERSION = "update hotel_admin set credential_version = credential_version + 1 where id = ?"
	}
}
