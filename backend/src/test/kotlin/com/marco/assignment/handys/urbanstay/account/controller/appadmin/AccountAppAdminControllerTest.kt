package com.marco.assignment.handys.urbanstay.account.controller.appadmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class AccountAppAdminControllerTest {

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@LocalServerPort
	private var port: Int = 0

	private val httpClient = HttpClient.newHttpClient()

	private lateinit var admin: AppAdmin

	@BeforeEach
	fun createAdmin() {
		admin = appAdminRepository.save(AppAdmin(LOGIN_ID, checkNotNull(passwordEncoder.encode(PASSWORD)), NAME))
	}

	@AfterEach
	fun deleteAdmin() {
		appAdminRepository.deleteById(checkNotNull(admin.id))
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
		assertError(Browser().post(LOGIN, loginBody(LOGIN_ID, PASSWORD)), CommonErrorCode.INVALID_CSRF_TOKEN)
	}

	@ParameterizedTest
	@CsvSource("$LOGIN_ID, wrong-password", "unknown-login@test.local, $PASSWORD")
	fun `아이디가 없거나 비밀번호가 틀리면 같은 401 INVALID_CREDENTIALS로 응답하고 세션을 만들지 않는다`(loginId: String, password: String) {
		val browser = Browser().withXsrfToken()

		assertError(browser.post(LOGIN, loginBody(loginId, password)), AccountErrorCode.INVALID_CREDENTIALS)
		assertThat(browser.cookie(SESSION_COOKIE)).isNull()
	}

	@Test
	fun `빈 아이디와 비밀번호는 필드마다 메시지 파일의 필수 입력 메시지와 함께 400으로 응답한다`() {
		val required = message("validation.required")

		assertError(
			Browser().withXsrfToken().post(LOGIN, loginBody(" ", "")),
			CommonErrorCode.INVALID_INPUT,
			mapOf("loginId" to required, "password" to required),
		)
	}

	@Test
	fun `로그인하면 계정 정보와 세션을 주고 XSRF-TOKEN을 새로 발급해 이전 토큰을 거절한다`() {
		val browser = Browser().withXsrfToken()
		val oldToken = checkNotNull(browser.cookie(XSRF_COOKIE))

		val response = browser.post(LOGIN, loginBody(LOGIN_ID, PASSWORD))

		assertSuccess(response, adminJson())
		assertThat(browser.cookie(SESSION_COOKIE)).isNotBlank()
		assertThat(browser.cookie(XSRF_COOKIE)).isNotBlank().isNotEqualTo(oldToken)
		assertError(browser.post(LOGOUT, xsrfHeader = oldToken), CommonErrorCode.INVALID_CSRF_TOKEN)
		assertSuccess(browser.get(ME), adminJson())
	}

	@ParameterizedTest
	@ValueSource(strings = [" Login-Test@TEST.local ", "LOGIN-TEST@test.local"])
	fun `대소문자와 앞뒤 공백이 다른 아이디로도 로그인한다`(loginId: String) {
		assertSuccess(Browser().withXsrfToken().post(LOGIN, loginBody(loginId, PASSWORD)), adminJson())
	}

	@Test
	fun `로그인한 세션으로 내 정보를 조회하면 로그인 응답과 같은 정보를 준다`() {
		assertSuccess(loggedIn().get(ME), adminJson())
	}

	@Test
	fun `세션이 있는 상태에서 로그인하면 세션 ID를 바꾸고 이전 세션 ID로는 로그인 상태를 쓸 수 없다`() {
		val browser = loggedIn()
		val oldSession = checkNotNull(browser.cookie(SESSION_COOKIE))

		assertSuccess(browser.post(LOGIN, loginBody(LOGIN_ID, PASSWORD)), adminJson())

		assertThat(browser.cookie(SESSION_COOKIE)).isNotBlank().isNotEqualTo(oldSession)
		assertSuccess(browser.get(ME), adminJson())
		assertError(Browser(SESSION_COOKIE to oldSession).get(ME), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `전체 어드민 세션으로 호텔 운영자 API를 요청하면 403 FORBIDDEN으로 응답한다`() {
		assertError(loggedIn().get(ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"), CommonErrorCode.FORBIDDEN)
	}

	@Test
	fun `로그인한 계정이 없어지면 내 정보 조회는 401 UNAUTHORIZED로 응답한다`() {
		val browser = loggedIn()

		appAdminRepository.deleteById(checkNotNull(admin.id))

		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `로그아웃하면 세션을 끝내고 세션 쿠키와 XSRF-TOKEN 쿠키를 지운다`() {
		val browser = loggedIn()
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
	fun `CSRF 토큰 없이 로그아웃하면 로그인했어도 403 INVALID_CSRF_TOKEN으로 응답하고 세션은 유지된다`() {
		val browser = loggedIn()

		assertError(browser.post(LOGOUT, xsrfHeader = null), CommonErrorCode.INVALID_CSRF_TOKEN)
		assertSuccess(browser.get(ME), adminJson())
	}

	private fun loggedIn(): Browser =
		Browser().withXsrfToken().also { assertSuccess(it.post(LOGIN, loginBody(LOGIN_ID, PASSWORD)), adminJson()) }

	private fun loginBody(loginId: String, password: String): String =
		jsonMapper.writeValueAsString(mapOf("loginId" to loginId, "password" to password))

	private fun adminJson(): String = """{"id":${admin.id},"loginId":"$LOGIN_ID","name":"$NAME"}"""

	private fun assertSuccess(response: HttpResponse<String>, data: String) {
		assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value())
		assertThat(json(response.body())).isEqualTo(json("""{"success":true,"data":$data,"error":null}"""))
	}

	private fun assertError(response: HttpResponse<String>, errorCode: ErrorCode, fieldErrors: Map<String, String> = emptyMap()) {
		val body = json(response.body())
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().associate { it["field"].stringValue() to it["message"].stringValue() }

		assertThat(response.statusCode()).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json("""{"success":false,"data":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode.messageKey)}"}}"""))
		assertThat(actualFieldErrors).isEqualTo(fieldErrors)
	}

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
		private const val LOGIN_ID = "login-test@test.local"
		private const val PASSWORD = "login-test-password"
		private const val NAME = "로그인 테스트 어드민"
		private const val AUTH = ApiPaths.APP_ADMIN + ApiPaths.AUTH
		private const val LOGIN = AUTH + ApiPaths.LOGIN
		private const val LOGOUT = "$AUTH/logout"
		private const val ME = "$AUTH/me"
		private const val SESSION_COOKIE = "JSESSIONID"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
	}
}
