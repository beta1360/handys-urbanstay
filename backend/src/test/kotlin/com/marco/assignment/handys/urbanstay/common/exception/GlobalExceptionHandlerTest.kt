package com.marco.assignment.handys.urbanstay.common.exception

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.config.SecurityConfig
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.Test
import org.skyscreamer.jsonassert.JSONCompareMode
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.json.JsonAssert
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.Locale

@WebMvcTest(
	controllers = [GlobalExceptionHandlerTest.TestController::class],
	properties = ["spring.messages.basename=messages,test-messages"],
)
@Import(
	GlobalExceptionHandlerTest.TestController::class,
	SecurityConfig::class,
	SecurityErrorHandler::class,
	ErrorResponseFactory::class,
)
class GlobalExceptionHandlerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var messageSource: MessageSource

	@Test
	fun `성공 응답은 data를 담고 error는 null이다`() {
		mockMvc.get("$TEST_PATH/items/1")
			.andExpectEnvelope(200, """{"success":true,"data":{"id":1,"name":"item"},"error":null}""")
	}

	@Test
	fun `ResponseEntity로 201 생성 응답을 감싼다`() {
		mockMvc.post("$TEST_PATH/items") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"name":"room","count":1}"""
		}.andExpectEnvelope(201, """{"success":true,"data":{"id":1,"name":"room"},"error":null}""")
	}

	@Test
	fun `BusinessException은 에러 코드의 상태와 코드로 응답한다`() {
		mockMvc.get("$TEST_PATH/business-error")
			.andExpectError(TestErrorCode.TEST_CONFLICT)
	}

	@Test
	fun `Accept-Language가 en이어도 한국어 메시지로 응답한다`() {
		mockMvc.get("$TEST_PATH/unknown") {
			header(HttpHeaders.ACCEPT_LANGUAGE, "en")
		}.andExpectError(CommonErrorCode.NOT_FOUND)
	}

	@Test
	fun `요청 본문 검증 실패는 필드 에러 목록과 함께 400으로 응답한다`() {
		mockMvc.post("$TEST_PATH/items") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"name":"","count":0}"""
		}.andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"""[{"field":"name","message":"이름은 필수입니다."},{"field":"count","message":"수량은 1 이상이어야 합니다."}]""",
		)
	}

	@Test
	fun `메서드 파라미터 검증 실패는 파라미터 이름으로 필드 에러를 채운다`() {
		mockMvc.get("$TEST_PATH/search?keyword=room&page=0")
			.andExpectError(
				CommonErrorCode.INVALID_INPUT,
				"""[{"field":"page","message":"페이지는 1 이상이어야 합니다."}]""",
			)
	}

	@Test
	fun `잘못된 JSON은 400으로 응답한다`() {
		mockMvc.post("$TEST_PATH/items") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"name":"""
		}.andExpectError(CommonErrorCode.INVALID_INPUT)
	}

	@Test
	fun `경로 변수 타입이 맞지 않으면 400으로 응답한다`() {
		mockMvc.get("$TEST_PATH/items/abc")
			.andExpectError(CommonErrorCode.INVALID_INPUT)
	}

	@Test
	fun `필수 요청 파라미터가 없으면 400으로 응답한다`() {
		mockMvc.get("$TEST_PATH/search")
			.andExpectError(CommonErrorCode.INVALID_INPUT)
	}

	@Test
	fun `지원하지 않는 미디어 타입은 400으로 응답한다`() {
		mockMvc.post("$TEST_PATH/items") {
			contentType = MediaType.TEXT_PLAIN
			content = "room"
		}.andExpectError(CommonErrorCode.INVALID_INPUT)
	}

	@Test
	fun `존재하지 않는 경로는 404로 응답한다`() {
		mockMvc.get("$TEST_PATH/unknown")
			.andExpectError(CommonErrorCode.NOT_FOUND)
	}

	@Test
	fun `지원하지 않는 HTTP 메서드는 404로 응답한다`() {
		mockMvc.delete("$TEST_PATH/items/1")
			.andExpectError(CommonErrorCode.NOT_FOUND)
	}

	@Test
	fun `예상하지 못한 예외는 메시지를 노출하지 않고 500으로 응답한다`() {
		mockMvc.get("$TEST_PATH/unexpected-error")
			.andExpectError(CommonErrorCode.INTERNAL_SERVER_ERROR)
			.andExpect { content { string(not(containsString(SECRET_MESSAGE))) } }
	}

	@Test
	fun `컨트롤러의 AccessDeniedException은 500이 아니라 로그인하지 않았으면 401로 응답한다`() {
		mockMvc.get("$TEST_PATH/access-denied")
			.andExpectError(CommonErrorCode.UNAUTHORIZED)
	}

	@Test
	fun `컨트롤러의 AccessDeniedException은 500이 아니라 로그인했으면 403으로 응답한다`() {
		mockMvc.get("$TEST_PATH/access-denied") { with(user("tester")) }
			.andExpectError(CommonErrorCode.FORBIDDEN)
	}

	@Test
	fun `컨트롤러의 AuthenticationException은 500이 아니라 401로 응답한다`() {
		mockMvc.get("$TEST_PATH/authentication-error") { with(user("tester")) }
			.andExpectError(CommonErrorCode.UNAUTHORIZED)
	}

	private fun ResultActionsDsl.andExpectEnvelope(httpStatus: Int, json: String): ResultActionsDsl =
		andExpect {
			status { isEqualTo(httpStatus) }
			match(content().json(json, JsonAssert.comparator(JSONCompareMode.NON_EXTENSIBLE)))
		}

	private fun ResultActionsDsl.andExpectError(errorCode: ErrorCode, fieldErrors: String = "[]"): ResultActionsDsl =
		andExpectEnvelope(
			errorCode.status.value(),
			"""{"success":false,"data":null,"error":{"code":"${errorCode.code}","message":"${koreanMessage(errorCode)}","fieldErrors":$fieldErrors}}""",
		)

	private fun koreanMessage(errorCode: ErrorCode): String =
		messageSource.getMessage(errorCode.messageKey, null, Locale.KOREAN)

	enum class TestErrorCode(override val status: HttpStatus) : ErrorCode {
		TEST_CONFLICT(HttpStatus.CONFLICT),
	}

	data class TestRequest(
		@NotBlank(message = "이름은 필수입니다.")
		val name: String,
		@Min(value = 1, message = "수량은 1 이상이어야 합니다.")
		val count: Int,
	)

	data class TestItem(val id: Long, val name: String)

	@RestController
	@RequestMapping(TEST_PATH)
	class TestController {

		@GetMapping("/items/{id}")
		fun getItem(@PathVariable id: Long): ApiResponse<TestItem> =
			ApiResponse.success(TestItem(id, "item"))

		@PostMapping("/items")
		fun createItem(@Valid @RequestBody request: TestRequest): ResponseEntity<ApiResponse<TestItem>> =
			ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(TestItem(1, request.name)))

		@GetMapping("/search")
		fun search(
			@RequestParam keyword: String,
			@RequestParam(defaultValue = "1") @Min(value = 1, message = "페이지는 1 이상이어야 합니다.") page: Int,
		): ApiResponse<String> = ApiResponse.success(keyword)

		@GetMapping("/business-error")
		fun businessError(): ApiResponse<Unit> = throw BusinessException(TestErrorCode.TEST_CONFLICT)

		@GetMapping("/unexpected-error")
		fun unexpectedError(): ApiResponse<Unit> = throw IllegalStateException(SECRET_MESSAGE)

		@GetMapping("/access-denied")
		fun accessDenied(): ApiResponse<Unit> = throw AccessDeniedException(SECRET_MESSAGE)

		@GetMapping("/authentication-error")
		fun authenticationError(): ApiResponse<Unit> = throw AuthenticationCredentialsNotFoundException(SECRET_MESSAGE)
	}

	companion object {
		private const val TEST_PATH = ApiPaths.APP + "/test"
		private const val SECRET_MESSAGE = "internal-detail-must-not-leak"
	}
}
