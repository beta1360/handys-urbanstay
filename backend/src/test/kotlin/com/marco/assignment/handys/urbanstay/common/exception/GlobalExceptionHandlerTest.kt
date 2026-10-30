package com.marco.assignment.handys.urbanstay.common.exception

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.config.JacksonConfig
import com.marco.assignment.handys.urbanstay.common.config.SecurityConfig
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
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
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.OffsetDateTime
import java.util.Locale

@WebMvcTest(
	controllers = [GlobalExceptionHandlerTest.TestController::class],
	properties = ["spring.messages.basename=messages,test-messages"],
)
@Import(
	GlobalExceptionHandlerTest.TestController::class,
	JacksonConfig::class,
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
	fun `올바른 본문은 문자열, 숫자, 불리언, enum, 날짜·시간, 중첩 객체, 목록을 그대로 읽는다`() {
		postDetail(detailBody())
			.andExpectEnvelope(200, """{"success":true,"data":${detailBody()},"error":null}""")
	}

	@Test
	fun `null을 허용하는 목록 원소는 null을 받는다`() {
		postDetail(detailBody("notes" to "[null]"))
			.andExpectEnvelope(200, """{"success":true,"data":${detailBody("notes" to "[null]")},"error":null}""")
	}

	@Test
	fun `ISO 형식이면 오프셋이 있는 날짜·시간을 받아 UTC로 읽는다`() {
		postDetail(detailBody("offsetDateTime" to "\"2026-10-29T19:00:00+09:00\""))
			.andExpectEnvelope(200, """{"success":true,"data":${detailBody()},"error":null}""")
	}

	@ParameterizedTest
	@ValueSource(strings = ["00:00", "09:30", "12:05", "23:59"])
	fun `시각은 시와 분이 두 자리씩인 문자열을 받아 같은 형식의 문자열로 응답한다`(time: String) {
		postDetail(detailBody("time" to "\"$time\""))
			.andExpectEnvelope(200, """{"success":true,"data":${detailBody("time" to "\"$time\"")},"error":null}""")
	}

	@Test
	fun `문서에 없는 필드는 그 필드 이름과 알 수 없는 항목 메시지로 400 응답한다`() {
		postDetail(detailBody("extra" to "1"))
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors("extra", UNKNOWN_FIELD))
	}

	@ParameterizedTest
	@MethodSource("detailFields")
	fun `빠진 필드는 그 필드 이름과 필수 입력 메시지로 400 응답한다`(field: String) {
		postDetail(detailBodyWithout(field))
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors(field, REQUIRED))
	}

	@ParameterizedTest
	@MethodSource("detailFields")
	fun `null인 필드는 그 필드 이름과 필수 입력 메시지로 400 응답한다`(field: String) {
		postDetail(detailBody(field to "null"))
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors(field, REQUIRED))
	}

	@ParameterizedTest
	@MethodSource("typeMismatches")
	fun `타입이 맞지 않는 값은 바꾸지 않고 그 필드 이름과 형식 메시지로 400 응답한다`(field: String, value: String) {
		postDetail(detailBody(field to value))
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors(field, TYPE))
	}

	@ParameterizedTest
	@MethodSource("nestedErrors")
	fun `중첩 객체와 목록 안의 필드 오류는 점과 인덱스로 이은 경로로 응답한다`(field: String, value: String, path: String, messageKey: String) {
		postDetail(detailBody(field to value))
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors(path, messageKey))
	}

	@Test
	fun `정수 필드는 타입 범위의 끝 값까지 읽는다`() {
		postNumbers(numberBody(*NUMBER_BOUNDS))
			.andExpectEnvelope(200, """{"success":true,"data":${numberBody(*NUMBER_BOUNDS)},"error":null}""")
	}

	@ParameterizedTest
	@MethodSource("integerMismatches")
	fun `정수 필드에 타입 범위를 넘는 정수나 실수를 보내면 바꾸지 않고 그 필드 경로와 형식 메시지로 400 응답한다`(field: String, value: String, path: String) {
		postNumbers(numberBody(field to value))
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors(path, TYPE))
	}

	@Test
	fun `목록 안 필드의 Bean Validation 경로도 같은 형식이다`() {
		postDetail(detailBody("rooms" to """[{"name":"101"},{"name":""}]"""))
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors("rooms[1].name", REQUIRED))
	}

	@ParameterizedTest
	@ValueSource(strings = ["""{"name":""", """{"name":tru}""", "[]", ""])
	fun `필드를 알 수 없는 본문 오류는 빈 필드 에러 목록과 함께 400으로 응답한다`(body: String) {
		postDetail(body).andExpectError(CommonErrorCode.INVALID_INPUT)
	}

	@ParameterizedTest
	@ValueSource(strings = ["abc", "9223372036854775808", "-9223372036854775809", "99999999999999999999"])
	fun `경로 변수 타입이 맞지 않거나 타입 범위를 넘으면 변수 이름과 형식 메시지로 400 응답한다`(id: String) {
		mockMvc.get("$TEST_PATH/items/$id")
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors("id", TYPE))
	}

	@ParameterizedTest
	@ValueSource(strings = ["abc", "2147483648", "-2147483649", "99999999999"])
	fun `요청 파라미터 타입이 맞지 않거나 타입 범위를 넘으면 파라미터 이름과 형식 메시지로 400 응답한다`(page: String) {
		mockMvc.get("$TEST_PATH/search?keyword=room&page=$page")
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors("page", TYPE))
	}

	@Test
	fun `불리언 요청 파라미터는 소문자 true와 false를 읽고 보내지 않은 선택 파라미터는 null이다`() {
		mockMvc.get("$TEST_PATH/flags?active=true&visible=false").andExpectEnvelope(200, """{"success":true,"data":[true,false],"error":null}""")
		mockMvc.get("$TEST_PATH/flags?active=false&visible=true").andExpectEnvelope(200, """{"success":true,"data":[false,true],"error":null}""")
		mockMvc.get("$TEST_PATH/flags").andExpectEnvelope(200, """{"success":true,"data":[null,false],"error":null}""")
	}

	@ParameterizedTest
	@ValueSource(strings = ["1", "0", "yes", "no", "on", "off", "TRUE", "True", "FALSE", "", " ", " true", "false ", "t", "2"])
	fun `불리언 요청 파라미터에 소문자 true와 false가 아닌 값을 보내면 빈 값과 앞뒤 공백을 포함해 파라미터 이름과 형식 메시지로 400 응답한다`(value: String) {
		mockMvc.get("$TEST_PATH/flags") { param("active", value) }.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors("active", TYPE))
	}

	@ParameterizedTest
	@ValueSource(strings = ["1", "yes", "TRUE", " ", " true"])
	fun `기본값이 있는 non-null 불리언 요청 파라미터도 소문자 true와 false가 아닌 값은 형식 메시지로 400 응답한다`(value: String) {
		mockMvc.get("$TEST_PATH/flags") { param("visible", value) }.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors("visible", TYPE))
	}

	@Test
	fun `기본값이 있는 요청 파라미터에 빈 값을 보내면 Spring이 변환 전에 기본값으로 바꾼다`() {
		mockMvc.get("$TEST_PATH/flags?visible=").andExpectEnvelope(200, """{"success":true,"data":[null,false],"error":null}""")
	}

	@Test
	fun `필수 요청 파라미터가 없으면 파라미터 이름과 필수 입력 메시지로 400 응답한다`() {
		mockMvc.get("$TEST_PATH/search")
			.andExpectError(CommonErrorCode.INVALID_INPUT, fieldErrors("keyword", REQUIRED))
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
			"""{"success":false,"data":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode.messageKey)}","fieldErrors":$fieldErrors}}""",
		)

	private fun fieldErrors(field: String, messageKey: String): String =
		"""[{"field":"$field","message":"${message(messageKey)}"}]"""

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private fun postDetail(body: String): ResultActionsDsl =
		mockMvc.post("$TEST_PATH/details") {
			contentType = MediaType.APPLICATION_JSON
			content = body
		}

	private fun postNumbers(body: String): ResultActionsDsl =
		mockMvc.post("$TEST_PATH/numbers") {
			contentType = MediaType.APPLICATION_JSON
			content = body
		}

	private fun numberBody(vararg fields: Pair<String, String>): String = json(VALID_NUMBERS + fields)

	private fun detailBody(vararg fields: Pair<String, String>): String = json(VALID_DETAIL + fields)

	private fun detailBodyWithout(field: String): String = json(VALID_DETAIL - field)

	private fun json(fields: Map<String, String>): String =
		fields.entries.joinToString(",", "{", "}") { (name, value) -> "\"$name\":$value" }

	enum class TestErrorCode(override val status: HttpStatus) : ErrorCode {
		TEST_CONFLICT(HttpStatus.CONFLICT),
	}

	data class TestRequest(
		@NotBlank(message = "이름은 필수입니다.")
		val name: String,
		@Min(value = 1, message = "수량은 1 이상이어야 합니다.")
		val count: Int,
	)

	data class TestDetailRequest(
		val name: String,
		val count: Int,
		val active: Boolean,
		val address: TestAddress,
		@Valid val rooms: List<TestRoom>,
		val grade: TestGrade,
		val tags: List<String>,
		val notes: List<String?>,
		val date: LocalDate,
		val dateTime: LocalDateTime,
		val offsetDateTime: OffsetDateTime,
		val time: LocalTime,
	)

	enum class TestGrade { STANDARD, DELUXE }

	data class TestAddress(val city: String)

	data class TestRoom(
		@NotBlank(message = "{validation.required}")
		val name: String,
	)

	data class TestNumberRequest(
		val int: Int,
		val nullableInt: Int?,
		val long: Long,
		val nullableLong: Long?,
		val ints: List<Int>,
		val longs: List<Long?>,
		val nested: TestNumberNested,
	)

	data class TestNumberNested(val int: Int, val long: Long)

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

		@PostMapping("/details")
		fun createDetail(@Valid @RequestBody request: TestDetailRequest): ApiResponse<TestDetailRequest> =
			ApiResponse.success(request)

		@PostMapping("/numbers")
		fun createNumbers(@RequestBody request: TestNumberRequest): ApiResponse<TestNumberRequest> =
			ApiResponse.success(request)

		@GetMapping("/search")
		fun search(
			@RequestParam keyword: String,
			@RequestParam(defaultValue = "1") @Min(value = 1, message = "페이지는 1 이상이어야 합니다.") page: Int,
		): ApiResponse<String> = ApiResponse.success(keyword)

		@GetMapping("/flags")
		fun flags(
			@RequestParam(required = false) active: Boolean?,
			@RequestParam(defaultValue = "false") visible: Boolean,
		): ApiResponse<List<Boolean?>> = ApiResponse.success(listOf(active, visible))

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
		private const val REQUIRED = "validation.required"
		private const val TYPE = "validation.type"
		private const val UNKNOWN_FIELD = "validation.unknown-field"
		private val VALID_DETAIL = linkedMapOf(
			"name" to "\"hotel\"",
			"count" to "1",
			"active" to "true",
			"address" to """{"city":"Seoul"}""",
			"rooms" to """[{"name":"101"}]""",
			"grade" to "\"DELUXE\"",
			"tags" to """["quiet"]""",
			"notes" to """["late",null]""",
			"date" to "\"2026-10-29\"",
			"dateTime" to "\"2026-10-29T10:00:00\"",
			"offsetDateTime" to "\"2026-10-29T10:00:00Z\"",
			"time" to "\"15:00\"",
		)
		private val VALID_NUMBERS = linkedMapOf(
			"int" to "1",
			"nullableInt" to "1",
			"long" to "1",
			"nullableLong" to "1",
			"ints" to "[1]",
			"longs" to "[1]",
			"nested" to """{"int":1,"long":1}""",
		)
		private val NUMBER_BOUNDS = arrayOf(
			"int" to "${Int.MAX_VALUE}",
			"nullableInt" to "${Int.MIN_VALUE}",
			"long" to "${Long.MAX_VALUE}",
			"nullableLong" to "${Long.MIN_VALUE}",
			"ints" to "[${Int.MIN_VALUE},${Int.MAX_VALUE}]",
			"longs" to "[${Long.MIN_VALUE},${Long.MAX_VALUE}]",
			"nested" to """{"int":${Int.MIN_VALUE},"long":${Long.MAX_VALUE}}""",
		)

		@JvmStatic
		fun detailFields(): List<String> = VALID_DETAIL.keys.toList()

		@JvmStatic
		fun integerMismatches(): List<Arguments> = listOf(
			Arguments.of("int", "2147483648", "int"),
			Arguments.of("int", "-2147483649", "int"),
			Arguments.of("int", "99999999999999999999", "int"),
			Arguments.of("nullableInt", "3000000000", "nullableInt"),
			Arguments.of("long", "9223372036854775808", "long"),
			Arguments.of("long", "-9223372036854775809", "long"),
			Arguments.of("nullableLong", "99999999999999999999", "nullableLong"),
			Arguments.of("ints", "[1,2147483648]", "ints[1]"),
			Arguments.of("longs", "[9223372036854775808]", "longs[0]"),
			Arguments.of("nested", """{"int":2147483648,"long":1}""", "nested.int"),
			Arguments.of("nested", """{"int":1,"long":9223372036854775808}""", "nested.long"),
			Arguments.of("int", "1.5", "int"),
			Arguments.of("int", "1e30", "int"),
			Arguments.of("nullableInt", "1.0", "nullableInt"),
			Arguments.of("long", "1e30", "long"),
			Arguments.of("nullableLong", "1.5", "nullableLong"),
			Arguments.of("ints", "[1e30]", "ints[0]"),
			Arguments.of("nested", """{"int":1,"long":1.5}""", "nested.long"),
		)

		@JvmStatic
		fun typeMismatches(): List<Arguments> = listOf(
			Arguments.of("name", """["hotel"]"""),
			Arguments.of("name", """{"value":"hotel"}"""),
			Arguments.of("name", "123"),
			Arguments.of("name", "1.5"),
			Arguments.of("name", "true"),
			Arguments.of("count", "\"1\""),
			Arguments.of("count", "1.5"),
			Arguments.of("count", "true"),
			Arguments.of("active", "\"true\""),
			Arguments.of("active", "1"),
			Arguments.of("address", "\"Seoul\""),
			Arguments.of("rooms", """{"name":"101"}"""),
			Arguments.of("grade", "0"),
			Arguments.of("grade", "\"0\""),
			Arguments.of("grade", "\"SUITE\""),
			Arguments.of("tags", "\"quiet\""),
			Arguments.of("date", "20000"),
			Arguments.of("date", "[2026,10,29]"),
			Arguments.of("date", "\"2026-10-29T10:00:00\""),
			Arguments.of("date", "\"2026-13-01\""),
			Arguments.of("dateTime", "1700000000"),
			Arguments.of("dateTime", "[2026,10,29,10,0]"),
			Arguments.of("dateTime", "\"2026-10-29T10:00:00Z\""),
			Arguments.of("dateTime", "\"2026-10-29\""),
			Arguments.of("offsetDateTime", "1700000000"),
			Arguments.of("offsetDateTime", "1700000000.5"),
			Arguments.of("offsetDateTime", "\"1700000000\""),
			Arguments.of("offsetDateTime", "\"2026-10-29T10:00:00\""),
			Arguments.of("time", "\"15:00:00\""),
			Arguments.of("time", "\"15:00:00.000\""),
			Arguments.of("time", "\"9:30\""),
			Arguments.of("time", "\"24:00\""),
			Arguments.of("time", "\"15:60\""),
			Arguments.of("time", "\"1500\""),
			Arguments.of("time", "\"15:00Z\""),
			Arguments.of("time", "\"15:00+09:00\""),
			Arguments.of("time", "\" 15:00\""),
			Arguments.of("time", "\"15:00 \""),
			Arguments.of("time", "\"\""),
			Arguments.of("time", "\"2026-10-29T15:00\""),
			Arguments.of("time", "54000"),
			Arguments.of("time", "15.5"),
			Arguments.of("time", "[15,0]"),
			Arguments.of("time", """{"hour":15,"minute":0}"""),
		)

		@JvmStatic
		fun nestedErrors(): List<Arguments> = listOf(
			Arguments.of("address", """{"city":1}""", "address.city", TYPE),
			Arguments.of("address", "{}", "address.city", REQUIRED),
			Arguments.of("address", """{"city":"Seoul","zip":"04524"}""", "address.zip", UNKNOWN_FIELD),
			Arguments.of("rooms", """[{"name":"101"},{"name":["102"]}]""", "rooms[1].name", TYPE),
			Arguments.of("rooms", """[{"name":"101"},{}]""", "rooms[1].name", REQUIRED),
			Arguments.of("rooms", """[{"name":"101"},{"name":"102","floor":1}]""", "rooms[1].floor", UNKNOWN_FIELD),
			Arguments.of("rooms", "[null]", "rooms[0]", REQUIRED),
			Arguments.of("tags", "[null]", "tags[0]", REQUIRED),
			Arguments.of("tags", """["quiet",null]""", "tags[1]", REQUIRED),
			Arguments.of("tags", """["quiet",1]""", "tags[1]", TYPE),
		)
	}
}
