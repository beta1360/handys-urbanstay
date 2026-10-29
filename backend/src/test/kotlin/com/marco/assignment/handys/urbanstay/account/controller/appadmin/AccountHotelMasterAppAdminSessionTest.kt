package com.marco.assignment.handys.urbanstay.account.controller.appadmin

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
class AccountHotelMasterAppAdminSessionTest {

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

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
	private val adminLoginId = "admin-$suffix@test.local"

	private lateinit var hotel: Hotel

	private lateinit var master: HotelAdmin

	private lateinit var admin: AppAdmin

	@BeforeEach
	fun createAccounts() {
		hotel = hotelRepository.save(Hotel("어반스테이 $suffix", "서울 $suffix", PHONE, null))
		master = hotelAdminRepository.save(HotelAdmin(hotel, masterLoginId, encode(PASSWORD), MASTER_NAME, HotelAdminRole.MASTER))
		admin = appAdminRepository.save(AppAdmin(adminLoginId, encode(ADMIN_PASSWORD), "어드민"))
	}

	@AfterEach
	fun deleteAccounts() {
		jdbcTemplate.update(DELETE_HOTEL_ADMINS, hotel.id)
		hotelRepository.deleteById(checkNotNull(hotel.id))
		appAdminRepository.deleteById(checkNotNull(admin.id))
	}

	@Test
	fun `어드민이 아이디를 바꾸면 마스터의 기존 세션은 다음 요청에서 401로 끊기고 새 아이디로만 다시 로그인할 수 있다`() {
		val masterBrowser = loggedInMaster(masterLoginId, PASSWORD)
		val newLoginId = "new-$suffix@test.local"

		assertThat(loggedInAdmin().put(masterPath(), updateBody(" ${newLoginId.uppercase()} ", MASTER_NAME, 0)).statusCode())
			.isEqualTo(HttpStatus.OK.value())

		assertError(masterBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(Browser().withXsrfToken().post(LOGIN, loginBody(masterLoginId, PASSWORD)), AccountErrorCode.INVALID_CREDENTIALS)
		assertThat(me(loggedInMaster(newLoginId, PASSWORD))["loginId"].stringValue()).isEqualTo(newLoginId)
	}

	@Test
	fun `어드민이 이름만 바꾸면 마스터의 세션은 유지되고 내 정보에 새 이름이 나온다`() {
		val masterBrowser = loggedInMaster(masterLoginId, PASSWORD)

		assertThat(loggedInAdmin().put(masterPath(), updateBody(masterLoginId, "새 이름", 0)).statusCode()).isEqualTo(HttpStatus.OK.value())

		repeat(2) { assertThat(me(masterBrowser)["name"].stringValue()).isEqualTo("새 이름") }
	}

	@Test
	fun `어드민이 대소문자와 앞뒤 공백만 다른 같은 아이디로 수정하면 마스터의 세션은 유지된다`() {
		val masterBrowser = loggedInMaster(masterLoginId, PASSWORD)

		assertThat(loggedInAdmin().put(masterPath(), updateBody(" ${masterLoginId.uppercase()} ", "새 이름", 0)).statusCode())
			.isEqualTo(HttpStatus.OK.value())

		assertThat(me(masterBrowser)["loginId"].stringValue()).isEqualTo(masterLoginId)
	}

	@Test
	fun `어드민이 비밀번호를 재설정하면 마스터의 기존 세션은 다음 요청에서 401로 끊기고 새 비밀번호로만 다시 로그인할 수 있다`() {
		val masterBrowser = loggedInMaster(masterLoginId, PASSWORD)

		assertThat(loggedInAdmin().put(passwordPath(), passwordBody(NEW_PASSWORD)).statusCode()).isEqualTo(HttpStatus.OK.value())

		assertError(masterBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertError(Browser().withXsrfToken().post(LOGIN, loginBody(masterLoginId, PASSWORD)), AccountErrorCode.INVALID_CREDENTIALS)
		assertThat(me(loggedInMaster(masterLoginId, NEW_PASSWORD))["loginId"].stringValue()).isEqualTo(masterLoginId)
	}

	@Test
	fun `어드민이 지금과 같은 비밀번호로 재설정해도 마스터의 기존 세션은 끊기고 같은 비밀번호로 다시 로그인한다`() {
		val masterBrowser = loggedInMaster(masterLoginId, PASSWORD)

		assertThat(loggedInAdmin().put(passwordPath(), passwordBody(PASSWORD)).statusCode()).isEqualTo(HttpStatus.OK.value())

		assertError(masterBrowser.get(ME), CommonErrorCode.UNAUTHORIZED)
		assertThat(me(loggedInMaster(masterLoginId, PASSWORD))["loginId"].stringValue()).isEqualTo(masterLoginId)
	}

	private fun encode(password: String): String = checkNotNull(passwordEncoder.encode(password))

	private fun passwordPath(): String = "${masterPath()}/password"

	private fun passwordBody(password: String): String = jsonMapper.writeValueAsString(mapOf("password" to password))

	private fun masterPath(): String = "${ApiPaths.APP_ADMIN}/hotels/${hotel.id}/master"

	private fun loggedInMaster(loginId: String, password: String): Browser =
		Browser().withXsrfToken().also { assertThat(it.post(LOGIN, loginBody(loginId, password)).statusCode()).isEqualTo(HttpStatus.OK.value()) }

	private fun loggedInAdmin(): Browser =
		Browser().also {
			it.get(APP_ADMIN_ME)
			assertThat(it.post(APP_ADMIN_LOGIN, loginBody(adminLoginId, ADMIN_PASSWORD)).statusCode()).isEqualTo(HttpStatus.OK.value())
		}

	private fun me(browser: Browser): JsonNode {
		val response = browser.get(ME)
		assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value())
		return json(response.body())["data"]
	}

	private fun loginBody(loginId: String, password: String): String =
		jsonMapper.writeValueAsString(mapOf("loginId" to loginId, "password" to password))

	private fun updateBody(loginId: String, name: String, version: Long): String =
		jsonMapper.writeValueAsString(mapOf("loginId" to loginId, "name" to name, "version" to version))

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
		private const val ADMIN_PASSWORD = "admin-password-1"
		private const val MASTER_NAME = "마스터"
		private const val PHONE = "02-1234-5678"
		private const val AUTH = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH
		private const val LOGIN = AUTH + ApiPaths.LOGIN
		private const val ME = "$AUTH/me"
		private const val APP_ADMIN_ME = ApiPaths.APP_ADMIN + ApiPaths.AUTH + "/me"
		private const val APP_ADMIN_LOGIN = ApiPaths.APP_ADMIN + ApiPaths.AUTH + ApiPaths.LOGIN
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
	}
}
