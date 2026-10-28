package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import com.marco.assignment.handys.urbanstay.common.security.Role
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.junit.jupiter.params.provider.ValueSource
import org.skyscreamer.jsonassert.JSONCompareMode
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.json.JsonAssert
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.Locale

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(
	TestcontainersConfiguration::class,
	SecurityConfigTest.SampleController::class,
	SecurityConfigTest.ServletController::class,
)
class SecurityConfigTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var messageSource: MessageSource

	@LocalServerPort
	private var port: Int = 0

	private val httpClient = HttpClient.newHttpClient()

	@Test
	fun `게스트 API는 로그인과 CSRF 토큰 없이 GET과 POST를 처리한다`() {
		mockMvc.get(GUEST_SAMPLES).andExpectSuccess()
		mockMvc.post(GUEST_SAMPLES).andExpectSuccess()
	}

	@Test
	fun `게스트 API의 없는 경로는 404 에러 형식으로 응답한다`() {
		mockMvc.get("${ApiPaths.APP}/unknown").andExpectError(CommonErrorCode.NOT_FOUND)
	}

	@Test
	fun `게스트 API는 세션과 쿠키를 만들지 않는다`() {
		val results = listOf(mockMvc.get(GUEST_SAMPLES).andReturn(), mockMvc.post(GUEST_SAMPLES).andReturn())

		assertThat(results).allSatisfy { result ->
			assertThat(result.request.getSession(false)).isNull()
			assertThat(result.response.cookies).isEmpty()
		}
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `어드민 API는 로그인하지 않으면 401로 응답한다`(api: AdminApi) {
		val xsrf = xsrfCookie(api)

		mockMvc.get(api.samples).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.post(api.samples) {
			cookie(xsrf)
			header(XSRF_HEADER, xsrf.value)
		}.andExpectError(CommonErrorCode.UNAUTHORIZED)
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `어드민 API에 로그인하지 않고 CSRF 토큰 없이 POST하면 CSRF 검사가 먼저 403으로 응답한다`(api: AdminApi) {
		mockMvc.post(api.samples).andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `어드민 API는 다른 앱의 역할로 로그인하면 403으로 응답한다`(api: AdminApi) {
		val xsrf = xsrfCookie(api)

		mockMvc.get(api.samples) { with(user(USERNAME).roles(api.otherRole.name)) }
			.andExpectError(CommonErrorCode.FORBIDDEN)
		mockMvc.post(api.samples) {
			with(user(USERNAME).roles(api.otherRole.name))
			cookie(xsrf)
			header(XSRF_HEADER, xsrf.value)
		}.andExpectError(CommonErrorCode.FORBIDDEN)
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `어드민 API는 자기 앱의 역할이면 GET에 성공한다`(api: AdminApi) {
		mockMvc.get(api.samples) { with(user(USERNAME).roles(api.role.name)) }.andExpectSuccess()
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `어드민 API는 자기 앱의 역할이어도 CSRF 토큰이 없거나 다르면 POST를 403으로 거절한다`(api: AdminApi) {
		val xsrf = xsrfCookie(api)

		mockMvc.post(api.samples) { with(user(USERNAME).roles(api.role.name)) }
			.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		mockMvc.post(api.samples) {
			with(user(USERNAME).roles(api.role.name))
			cookie(xsrf)
		}.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		mockMvc.post(api.samples) {
			with(user(USERNAME).roles(api.role.name))
			cookie(xsrf)
			header(XSRF_HEADER, "invalid-token")
		}.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `어드민 API는 XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 보내면 POST에 성공한다`(api: AdminApi) {
		val xsrf = xsrfCookie(api)

		mockMvc.post(api.samples) {
			with(user(USERNAME).roles(api.role.name))
			cookie(xsrf)
			header(XSRF_HEADER, xsrf.value)
		}.andExpectSuccess()
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `XSRF-TOKEN 쿠키는 어드민 API의 401 응답에서도 발급되고 스크립트에서 읽을 수 있다`(api: AdminApi) {
		val result = mockMvc.get(api.samples).andExpect { status { isUnauthorized() } }.andReturn()
		val xsrf = result.response.getCookie(XSRF_COOKIE)

		assertThat(xsrf).isNotNull()
		assertThat(xsrf!!.value).isNotBlank()
		assertThat(xsrf.isHttpOnly).isFalse()
		assertThat(xsrf.path).isEqualTo("/")
	}

	@ParameterizedTest
	@EnumSource(AdminApi::class)
	fun `어드민 API는 자기 앱의 역할로 없는 경로를 요청하면 404 에러 형식으로 응답한다`(api: AdminApi) {
		mockMvc.get("${api.prefix}/unknown") { with(user(USERNAME).roles(api.role.name)) }
			.andExpectError(CommonErrorCode.NOT_FOUND)
	}

	@ParameterizedTest
	@ValueSource(strings = ["/v3/api-docs/app", "/v3/api-docs/app-admin", "/v3/api-docs/hotel-admin", "/v3/api-docs/swagger-config", "/swagger-ui/index.html"])
	fun `API 문서와 Swagger UI는 로그인 없이 열리고 XSRF-TOKEN 쿠키를 발급하지 않는다`(path: String) {
		mockMvc.get(path).andExpect {
			status { isOk() }
			cookie { doesNotExist(XSRF_COOKIE) }
		}
	}

	@Test
	fun `Swagger UI 주소는 로그인 없이 UI 화면으로 이동한다`() {
		mockMvc.get("/swagger-ui.html").andExpect { status { is3xxRedirection() } }
	}

	@ParameterizedTest
	@ValueSource(strings = ["/actuator", "/actuator/health", "/error", "/login", "/unknown"])
	fun `그 밖의 경로는 로그인하지 않으면 401로 응답한다`(path: String) {
		mockMvc.get(path).andExpectError(CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `그 밖의 경로는 로그인해도 403으로 응답한다`() {
		mockMvc.get("/actuator/health") { with(user(USERNAME).roles(Role.APP_ADMIN.name)) }
			.andExpectError(CommonErrorCode.FORBIDDEN)
	}

	@Test
	fun `기본 로그아웃과 HTTP Basic 인증은 꺼져 있다`() {
		mockMvc.post("/logout").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get(AdminApi.APP_ADMIN.samples) { header(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNzd29yZA==") }
			.andExpectError(CommonErrorCode.UNAUTHORIZED)
			.andExpect { header { doesNotExist(HttpHeaders.WWW_AUTHENTICATE) } }
	}

	@Test
	fun `세션 쿠키는 HttpOnly와 SameSite=Lax로 발급되고 세션은 8시간 유지된다`() {
		val response = send(SESSION_PATH)
		val sessionCookie = response.headers().allValues(HttpHeaders.SET_COOKIE).single { it.startsWith("JSESSIONID=") }

		assertThat(sessionCookie.split("; ")).contains("HttpOnly", "SameSite=Lax")
		assertThat(response.body()).contains(""""data":${8 * 60 * 60}""")
	}

	@Test
	fun `실제 서버에서도 게스트 API 응답에는 Set-Cookie가 없다`() {
		val response = send(GUEST_SAMPLES)

		assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value())
		assertThat(response.headers().allValues(HttpHeaders.SET_COOKIE)).isEmpty()
	}

	@ParameterizedTest
	@ValueSource(strings = [ApiPaths.APP_ADMIN + SAMPLES, ApiPaths.HOTEL_ADMIN + SAMPLES, "/actuator/health"])
	fun `로그인하지 않은 401 응답은 Accept 헤더와 관계없이 세션 쿠키를 만들지 않는다`(path: String) {
		listOf(MediaType.ALL_VALUE, MediaType.APPLICATION_JSON_VALUE).forEach { accept ->
			val response = send(path, accept)

			assertThat(response.statusCode()).describedAs(accept).isEqualTo(HttpStatus.UNAUTHORIZED.value())
			assertThat(response.headers().allValues(HttpHeaders.SET_COOKIE)).describedAs(accept).noneMatch { it.startsWith("JSESSIONID=") }
		}
	}

	@Test
	fun `에러 디스패치는 401로 바뀌지 않고 원래 상태 코드로 응답한다`() {
		val response = send(SEND_ERROR_PATH)

		assertThat(response.statusCode()).isEqualTo(HttpStatus.CONFLICT.value())
	}

	private fun send(path: String, accept: String = MediaType.ALL_VALUE): HttpResponse<String> =
		httpClient.send(
			HttpRequest.newBuilder(URI.create("http://localhost:$port$path")).header(HttpHeaders.ACCEPT, accept).build(),
			HttpResponse.BodyHandlers.ofString(),
		)

	private fun xsrfCookie(api: AdminApi): Cookie =
		mockMvc.get(api.samples).andReturn().response.getCookie(XSRF_COOKIE)!!

	private fun ResultActionsDsl.andExpectSuccess(): ResultActionsDsl =
		andExpectEnvelope(HttpStatus.OK.value(), """{"success":true,"data":"$SAMPLE","error":null}""")

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode): ResultActionsDsl =
		andExpectEnvelope(
			errorCode.status.value(),
			"""{"success":false,"data":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode)}","fieldErrors":[]}}""",
		)

	private fun ResultActionsDsl.andExpectEnvelope(httpStatus: Int, json: String): ResultActionsDsl =
		andExpect {
			status { isEqualTo(httpStatus) }
			match(content().json(json, JsonAssert.comparator(JSONCompareMode.NON_EXTENSIBLE)))
		}

	private fun message(errorCode: ErrorCode): String = messageSource.getMessage(errorCode.messageKey, null, Locale.KOREAN)

	enum class AdminApi(val prefix: String, val role: Role, val otherRole: Role) {
		APP_ADMIN(ApiPaths.APP_ADMIN, Role.APP_ADMIN, Role.HOTEL_ADMIN),
		HOTEL_ADMIN(ApiPaths.HOTEL_ADMIN, Role.HOTEL_ADMIN, Role.APP_ADMIN),
		;

		val samples: String get() = prefix + SAMPLES
	}

	@RestController
	@RequestMapping(ApiPaths.APP + SAMPLES, ApiPaths.APP_ADMIN + SAMPLES, ApiPaths.HOTEL_ADMIN + SAMPLES)
	class SampleController {

		@GetMapping
		fun getSample(): ApiResponse<String> = ApiResponse.success(SAMPLE)

		@PostMapping
		fun createSample(): ApiResponse<String> = ApiResponse.success(SAMPLE)
	}

	@RestController
	@RequestMapping(ApiPaths.APP + SERVLET)
	class ServletController {

		@GetMapping(SESSION)
		fun createSession(request: HttpServletRequest): ApiResponse<Int> =
			ApiResponse.success(request.getSession(true).maxInactiveInterval)

		@GetMapping(SEND_ERROR)
		fun sendError(response: HttpServletResponse) = response.sendError(HttpStatus.CONFLICT.value())
	}

	companion object {
		private const val SAMPLES = "/security-samples"
		private const val SERVLET = "/security-servlet"
		private const val SESSION = "/session"
		private const val SEND_ERROR = "/send-error"
		private const val GUEST_SAMPLES = ApiPaths.APP + SAMPLES
		private const val SESSION_PATH = ApiPaths.APP + SERVLET + SESSION
		private const val SEND_ERROR_PATH = ApiPaths.APP + SERVLET + SEND_ERROR
		private const val SAMPLE = "sample"
		private const val USERNAME = "tester"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
	}
}
