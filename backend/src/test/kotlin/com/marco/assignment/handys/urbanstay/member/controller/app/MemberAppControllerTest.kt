package com.marco.assignment.handys.urbanstay.member.controller.app

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.member.exception.MemberErrorCode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
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
class MemberAppControllerTest {

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@LocalServerPort
	private var port: Int = 0

	private val httpClient = HttpClient.newHttpClient()

	private val email = "member-${UUID.randomUUID().toString().take(8)}@test.local"

	@AfterEach
	fun deleteMember() {
		jdbcTemplate.update("delete from member where email = ?", email)
	}

	@Test
	fun `가입하면 201과 회원 정보를 주고 바로 로그인한 세션을 만들며 이메일은 소문자로 저장한다`() {
		val browser = Browser()

		val response = browser.post(SIGNUP, signupBody(" ${email.uppercase()} ", " 홍길동 ", " 010-1234-5678 "))

		val data = assertSuccess(response, HttpStatus.CREATED, "success.member.signed-up")
		assertThat(data).isEqualTo(memberJson(data["id"].longValue()))
		assertThat(browser.cookie(SESSION_COOKIE)).isNotBlank()
		assertThat(browser.cookie(XSRF_COOKIE)).isNull()
		assertThat(assertSuccess(browser.get(ME), HttpStatus.OK)).isEqualTo(data)
		assertThat(jdbcTemplate.queryForObject("select password_hash from member where email = ?", String::class.java, email)).isNotEqualTo(PASSWORD)
	}

	@Test
	fun `대소문자만 다른 이미 가입한 이메일로 가입하면 409 MEMBER_EMAIL_DUPLICATED로 응답하고 로그인하지 않는다`() {
		assertSuccess(Browser().post(SIGNUP, signupBody(email)), HttpStatus.CREATED, "success.member.signed-up")
		val browser = Browser()

		assertError(browser.post(SIGNUP, signupBody(email.uppercase())), MemberErrorCode.MEMBER_EMAIL_DUPLICATED)
		assertThat(browser.cookie(SESSION_COOKIE)).isNull()
	}

	@Test
	fun `가입 항목이 규칙에 맞지 않으면 틀린 항목을 모두 담아 400으로 응답한다`() {
		val body = jsonMapper.writeValueAsString(mapOf("email" to "guest", "password" to "short", "name" to " ", "phone" to "1234567"))

		assertError(
			Browser().post(SIGNUP, body),
			CommonErrorCode.INVALID_INPUT,
			mapOf(
				"email" to message("validation.email"),
				"password" to message("validation.password"),
				"name" to message("validation.required"),
				"phone" to message("validation.phone"),
			),
		)
	}

	@Test
	fun `가입한 이메일과 비밀번호로 로그인하면 회원 정보와 새 세션을 주고 대소문자와 앞뒤 공백은 구분하지 않는다`() {
		val id = assertSuccess(Browser().post(SIGNUP, signupBody(email)), HttpStatus.CREATED, "success.member.signed-up")["id"].longValue()
		val browser = Browser()

		val data = assertSuccess(browser.post(LOGIN, loginBody(" ${email.uppercase()} ", PASSWORD)), HttpStatus.OK, "success.auth.login")

		assertThat(data).isEqualTo(memberJson(id))
		assertThat(browser.cookie(SESSION_COOKIE)).isNotBlank()
		assertThat(assertSuccess(browser.get(ME), HttpStatus.OK)).isEqualTo(data)
	}

	@Test
	fun `없는 이메일이나 틀린 비밀번호로 로그인하면 같은 401 INVALID_CREDENTIALS로 응답하고 세션을 만들지 않는다`() {
		assertSuccess(Browser().post(SIGNUP, signupBody(email)), HttpStatus.CREATED, "success.member.signed-up")

		listOf(loginBody(email, "wrong-password1"), loginBody("unknown-$email", PASSWORD)).forEach { body ->
			val browser = Browser()
			assertError(browser.post(LOGIN, body), AccountErrorCode.INVALID_CREDENTIALS)
			assertThat(browser.cookie(SESSION_COOKIE)).isNull()
		}
	}

	@Test
	fun `로그인하지 않고 내 정보 조회와 로그아웃을 하면 401 UNAUTHORIZED로 응답하고 세션을 만들지 않는다`() {
		val browser = Browser()

		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(browser.post(LOGOUT), CommonErrorCode.UNAUTHORIZED)
		assertThat(browser.cookie(SESSION_COOKIE)).isNull()
	}

	@Test
	fun `로그아웃하면 세션을 끝내고 세션 쿠키를 지워 이전 세션으로는 로그인 상태를 쓸 수 없다`() {
		val browser = Browser()
		assertSuccess(browser.post(SIGNUP, signupBody(email)), HttpStatus.CREATED, "success.member.signed-up")
		val session = checkNotNull(browser.cookie(SESSION_COOKIE))

		val response = browser.post(LOGOUT)

		assertThat(assertSuccess(response, HttpStatus.OK, "success.auth.logout").isNull).isTrue()
		assertThat(setCookies(response).filter { it.maxAge == 0L }.map { it.name }).contains(SESSION_COOKIE)
		assertError(browser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(Browser(SESSION_COOKIE to session).get(ME), CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `회원 세션으로 어드민 API를 요청하면 401 UNAUTHORIZED로 응답한다`() {
		val browser = Browser()
		assertSuccess(browser.post(SIGNUP, signupBody(email)), HttpStatus.CREATED, "success.member.signed-up")

		assertError(browser.get(ApiPaths.APP_ADMIN + ApiPaths.AUTH + "/me"), CommonErrorCode.UNAUTHORIZED)
	}

	private fun signupBody(email: String, name: String = NAME, phone: String = PHONE): String =
		jsonMapper.writeValueAsString(mapOf("email" to email, "password" to PASSWORD, "name" to name, "phone" to phone))

	private fun loginBody(email: String, password: String): String = jsonMapper.writeValueAsString(mapOf("email" to email, "password" to password))

	private fun memberJson(id: Long): JsonNode = json(jsonMapper.writeValueAsString(linkedMapOf("id" to id, "email" to email, "name" to NAME, "phone" to PHONE)))

	private fun assertSuccess(response: HttpResponse<String>, status: HttpStatus, messageKey: String? = null): JsonNode {
		val body = json(response.body())
		assertThat(response.statusCode()).isEqualTo(status.value())
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].stringValue(null)).isEqualTo(messageKey?.let(::message))
		assertThat(body["error"].isNull).isTrue()
		return body["data"]
	}

	private fun assertError(response: HttpResponse<String>, errorCode: ErrorCode, fieldErrors: Map<String, String> = emptyMap()) {
		val body = json(response.body())
		val actualFieldErrors = (body["error"] as ObjectNode).remove(FIELD_ERRORS)
			.values().associate { it["field"].stringValue() to it["message"].stringValue() }

		assertThat(response.statusCode()).isEqualTo(errorCode.status.value())
		assertThat(body).isEqualTo(json("""{"success":false,"data":null,"message":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode.messageKey)}"}}"""))
		assertThat(actualFieldErrors).isEqualTo(fieldErrors)
	}

	private fun setCookies(response: HttpResponse<String>): List<HttpCookie> =
		response.headers().allValues(HttpHeaders.SET_COOKIE).flatMap(HttpCookie::parse)

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private inner class Browser(vararg cookies: Pair<String, String>) {

		private val cookies = linkedMapOf(*cookies)

		fun cookie(name: String): String? = cookies[name]

		fun get(path: String): HttpResponse<String> = send(request(path).GET())

		fun post(path: String, body: String? = null): HttpResponse<String> {
			val request = request(path)
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
		private const val PASSWORD = "member-password1"
		private const val NAME = "홍길동"
		private const val PHONE = "010-1234-5678"
		private const val AUTH = ApiPaths.APP + ApiPaths.AUTH
		private const val SIGNUP = "$AUTH/signup"
		private const val LOGIN = AUTH + ApiPaths.LOGIN
		private const val LOGOUT = "$AUTH/logout"
		private const val ME = "$AUTH/me"
		private const val SESSION_COOKIE = "JSESSIONID"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
	}
}
