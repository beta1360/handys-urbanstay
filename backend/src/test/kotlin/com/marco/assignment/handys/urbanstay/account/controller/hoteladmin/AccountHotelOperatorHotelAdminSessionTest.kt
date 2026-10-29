package com.marco.assignment.handys.urbanstay.account.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
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
import org.springframework.security.crypto.password.PasswordEncoder
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.net.HttpCookie
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.Locale
import java.util.UUID

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class AccountHotelOperatorHotelAdminSessionTest {

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

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

	private lateinit var operator: HotelAdmin

	@BeforeEach
	fun createAccounts() {
		hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null))
		hotelAdminRepository.save(HotelAdmin(hotel, masterLoginId, encode(PASSWORD), MASTER_NAME, HotelAdminRole.MASTER))
		operator = hotelAdminRepository.save(HotelAdmin(hotel, operatorLoginId, encode(PASSWORD), OPERATOR_NAME, HotelAdminRole.OPERATOR))
	}

	@AfterEach
	fun deleteAccounts() {
		jdbcTemplate.update(DELETE_HOTEL_ADMINS, hotel.id)
		hotelRepository.deleteById(checkNotNull(hotel.id))
	}

	@Test
	fun `로그인한 마스터가 등록한 운영자는 자기 호텔 목록에 나오고 그 비밀번호로 로그인한다`() {
		val masterBrowser = loggedIn(masterLoginId, PASSWORD)
		val newLoginId = "new-$suffix@test.local"

		val created = masterBrowser.post(OPERATORS, createBody(newLoginId, NEW_PASSWORD))

		assertThat(created.statusCode()).isEqualTo(HttpStatus.CREATED.value())
		val id = json(created.body())["data"]["id"].longValue()
		assertThat(itemIds(masterBrowser.get(OPERATORS))).containsExactly(id, operator.id)
		val me = me(loggedIn(newLoginId, NEW_PASSWORD))
		assertThat(listOf(me["role"].stringValue(), me["hotel"]["id"].longValue())).containsExactly("OPERATOR", hotel.id)
	}

	@Test
	fun `로그인한 운영자가 운영자 API를 부르면 403 FORBIDDEN으로 응답하고 세션은 유지된다`() {
		val operatorBrowser = loggedIn(operatorLoginId, PASSWORD)

		assertError(operatorBrowser.get(OPERATORS), CommonErrorCode.FORBIDDEN)
		assertError(operatorBrowser.get("$OPERATORS/${operator.id}"), CommonErrorCode.FORBIDDEN)
		assertError(operatorBrowser.post(OPERATORS, createBody("new-$suffix@test.local", NEW_PASSWORD)), CommonErrorCode.FORBIDDEN)
		assertError(operatorBrowser.put(operatorPath(), updateBody("new-$suffix@test.local", OPERATOR_NAME, 0)), CommonErrorCode.FORBIDDEN)
		assertError(operatorBrowser.put("${operatorPath()}/password", passwordBody(NEW_PASSWORD)), CommonErrorCode.FORBIDDEN)
		assertError(operatorBrowser.put("${operatorPath()}/active", activeBody(false)), CommonErrorCode.FORBIDDEN)
		assertThat(me(operatorBrowser)["loginId"].stringValue()).isEqualTo(operatorLoginId)
		assertThat(hotelAdminRepository.findAll().filter { it.loginId == "new-$suffix@test.local" }).isEmpty()
	}

	@Test
	fun `마스터가 운영자 아이디를 바꾸면 운영자의 기존 세션은 다음 요청에서 401로 끊기고 새 아이디로만 다시 로그인하며 마스터 세션은 유지된다`() {
		val masterBrowser = loggedIn(masterLoginId, PASSWORD)
		val operatorBrowser = loggedIn(operatorLoginId, PASSWORD)
		val newLoginId = "new-$suffix@test.local"

		assertThat(masterBrowser.put(operatorPath(), updateBody(" ${newLoginId.uppercase()} ", OPERATOR_NAME, 0)).statusCode()).isEqualTo(HttpStatus.OK.value())

		assertError(operatorBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(Browser().withXsrfToken().post(LOGIN, loginBody(operatorLoginId, PASSWORD)), AccountErrorCode.INVALID_CREDENTIALS)
		assertThat(me(loggedIn(newLoginId, PASSWORD))["loginId"].stringValue()).isEqualTo(newLoginId)
		assertThat(me(masterBrowser)["loginId"].stringValue()).isEqualTo(masterLoginId)
	}

	@Test
	fun `마스터가 운영자 이름만 바꾸거나 대소문자와 앞뒤 공백만 다른 같은 아이디로 수정하면 운영자 세션은 유지되고 내 정보에 새 이름이 나온다`() {
		val masterBrowser = loggedIn(masterLoginId, PASSWORD)
		val operatorBrowser = loggedIn(operatorLoginId, PASSWORD)

		assertThat(masterBrowser.put(operatorPath(), updateBody(" ${operatorLoginId.uppercase()} ", "새 이름", 0)).statusCode())
			.isEqualTo(HttpStatus.OK.value())

		repeat(2) { assertThat(listOf("loginId", "name").map { me(operatorBrowser)[it].stringValue() }).containsExactly(operatorLoginId, "새 이름") }
	}

	@Test
	fun `마스터가 운영자 비밀번호를 재설정하면 같은 비밀번호여도 운영자의 기존 세션은 끊기고 새 비밀번호로 다시 로그인하며 마스터 세션은 유지된다`() {
		val masterBrowser = loggedIn(masterLoginId, PASSWORD)
		val operatorBrowser = loggedIn(operatorLoginId, PASSWORD)

		assertThat(masterBrowser.put("${operatorPath()}/password", passwordBody(NEW_PASSWORD)).statusCode()).isEqualTo(HttpStatus.OK.value())

		assertError(operatorBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(Browser().withXsrfToken().post(LOGIN, loginBody(operatorLoginId, PASSWORD)), AccountErrorCode.INVALID_CREDENTIALS)
		val reloggedIn = loggedIn(operatorLoginId, NEW_PASSWORD)
		assertThat(masterBrowser.put("${operatorPath()}/password", passwordBody(NEW_PASSWORD)).statusCode()).isEqualTo(HttpStatus.OK.value())
		assertError(reloggedIn.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertThat(me(loggedIn(operatorLoginId, NEW_PASSWORD))["loginId"].stringValue()).isEqualTo(operatorLoginId)
		assertThat(me(masterBrowser)["loginId"].stringValue()).isEqualTo(masterLoginId)
	}

	@Test
	fun `마스터가 운영자를 비활성화하면 운영자 세션은 401로 끊기고 로그인할 수 없으며, 다시 활성화해도 끊긴 세션은 그대로이고 새로 로그인한다`() {
		val masterBrowser = loggedIn(masterLoginId, PASSWORD)
		val operatorBrowser = loggedIn(operatorLoginId, PASSWORD)

		assertThat(masterBrowser.put("${operatorPath()}/active", activeBody(false)).statusCode()).isEqualTo(HttpStatus.OK.value())

		assertError(operatorBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(Browser().withXsrfToken().post(LOGIN, loginBody(operatorLoginId, PASSWORD)), AccountErrorCode.INVALID_CREDENTIALS)

		assertThat(masterBrowser.put("${operatorPath()}/active", activeBody(true)).statusCode()).isEqualTo(HttpStatus.OK.value())

		assertError(operatorBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertThat(me(loggedIn(operatorLoginId, PASSWORD))["loginId"].stringValue()).isEqualTo(operatorLoginId)
		assertThat(me(masterBrowser)["loginId"].stringValue()).isEqualTo(masterLoginId)
	}

	@Test
	fun `마스터가 이미 활성인 운영자를 활성으로 바꾸면 운영자 세션은 유지된다`() {
		val masterBrowser = loggedIn(masterLoginId, PASSWORD)
		val operatorBrowser = loggedIn(operatorLoginId, PASSWORD)

		assertThat(masterBrowser.put("${operatorPath()}/active", activeBody(true)).statusCode()).isEqualTo(HttpStatus.OK.value())

		repeat(2) { assertThat(me(operatorBrowser)["loginId"].stringValue()).isEqualTo(operatorLoginId) }
	}

	private fun encode(password: String): String = checkNotNull(passwordEncoder.encode(password))

	private fun loggedIn(loginId: String, password: String): Browser =
		Browser().withXsrfToken().also { assertThat(it.post(LOGIN, loginBody(loginId, password)).statusCode()).isEqualTo(HttpStatus.OK.value()) }

	private fun me(browser: Browser): JsonNode {
		val response = browser.get(ME)
		assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value())
		return json(response.body())["data"]
	}

	private fun itemIds(response: HttpResponse<String>): List<Long> {
		assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value())
		return json(response.body())["data"]["items"].values().map { it["id"].longValue() }
	}

	private fun loginBody(loginId: String, password: String): String =
		jsonMapper.writeValueAsString(mapOf("loginId" to loginId, "password" to password))

	private fun createBody(loginId: String, password: String): String =
		jsonMapper.writeValueAsString(mapOf("loginId" to loginId, "name" to OPERATOR_NAME, "password" to password))

	private fun updateBody(loginId: String, name: String, version: Long): String =
		jsonMapper.writeValueAsString(mapOf("loginId" to loginId, "name" to name, "version" to version))

	private fun passwordBody(password: String): String = jsonMapper.writeValueAsString(mapOf("password" to password))

	private fun activeBody(active: Boolean): String = jsonMapper.writeValueAsString(mapOf("active" to active))

	private fun operatorPath(): String = "$OPERATORS/${operator.id}"

	private fun assertError(response: HttpResponse<String>, errorCode: ErrorCode) {
		assertThat(response.statusCode()).isEqualTo(errorCode.status.value())
		assertThat(json(response.body())).isEqualTo(
			json("""{"success":false,"data":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode.messageKey)}","fieldErrors":[]}}"""),
		)
	}

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private inner class Browser {

		private val cookies = linkedMapOf<String, String>()

		fun withXsrfToken(): Browser = apply { get(ME) }

		fun get(path: String): HttpResponse<String> = send(request(path).GET())

		fun post(path: String, body: String): HttpResponse<String> = send(jsonRequest(path).POST(HttpRequest.BodyPublishers.ofString(body)))

		fun put(path: String, body: String): HttpResponse<String> = send(jsonRequest(path).PUT(HttpRequest.BodyPublishers.ofString(body)))

		private fun jsonRequest(path: String): HttpRequest.Builder =
			request(path)
				.header(XSRF_HEADER, checkNotNull(cookies[XSRF_COOKIE]))
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)

		private fun request(path: String): HttpRequest.Builder {
			val request = HttpRequest.newBuilder(URI.create("http://localhost:$port$path"))
			if (cookies.isNotEmpty()) {
				request.header(HttpHeaders.COOKIE, cookies.entries.joinToString("; ") { "${it.key}=${it.value}" })
			}
			return request
		}

		private fun send(request: HttpRequest.Builder): HttpResponse<String> {
			val response = httpClient.send(request.build(), HttpResponse.BodyHandlers.ofString())
			response.headers().allValues(HttpHeaders.SET_COOKIE).flatMap(HttpCookie::parse).forEach {
				if (it.maxAge == 0L) cookies.remove(it.name) else cookies[it.name] = it.value
			}
			return response
		}
	}

	companion object {
		private const val PASSWORD = "hotel-password-1"
		private const val NEW_PASSWORD = " new hotel password 2 "
		private const val MASTER_NAME = "마스터"
		private const val OPERATOR_NAME = "운영자"
		private const val PHONE = "02-1234-5678"
		private const val AUTH = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH
		private const val LOGIN = AUTH + ApiPaths.LOGIN
		private const val ME = "$AUTH/me"
		private const val OPERATORS = ApiPaths.HOTEL_ADMIN + ApiPaths.OPERATORS
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
	}
}
