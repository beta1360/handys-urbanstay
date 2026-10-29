package com.marco.assignment.handys.urbanstay.account.controller.hoteladmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.account.repository.HotelAdminRepository
import com.marco.assignment.handys.urbanstay.account.service.HotelAdminPrincipal
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.common.validation.Password
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
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
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
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
class AccountHotelOperatorHotelAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var hotelAdminRepository: HotelAdminRepository

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
	private val operatorLoginId = "operator-$suffix@test.local"

	private val createdHotelIds = mutableListOf<Long>()

	private val createdAppAdminIds = mutableListOf<Long>()

	private val xsrf: Cookie by lazy { checkNotNull(mockMvc.get(HOTEL_ADMIN_ME).andReturn().response.getCookie(XSRF_COOKIE)) }

	private lateinit var hotel: Hotel

	private lateinit var master: HotelAdmin

	private lateinit var otherMaster: HotelAdmin

	private lateinit var otherOperator: HotelAdmin

	private val masterPrincipal: UserDetails get() = HotelAdminPrincipal.from(master)

	@BeforeEach
	fun createAccounts() {
		hotel = saveHotel("어반스테이 $suffix")
		master = saveHotelAdmin(hotel, "master-$suffix@test.local", MASTER_NAME, HotelAdminRole.MASTER)
		val otherHotel = saveHotel("다른 호텔 $suffix")
		otherMaster = saveHotelAdmin(otherHotel, "other-master-$suffix@test.local", MASTER_NAME, HotelAdminRole.MASTER)
		otherOperator = saveHotelAdmin(otherHotel, "other-operator-$suffix@test.local", OPERATOR_NAME, HotelAdminRole.OPERATOR)
	}

	@AfterEach
	fun deleteAccounts() {
		executor.shutdownNow()
		createdHotelIds.forEach { jdbcTemplate.update(DELETE_HOTEL_ADMINS, it) }
		hotelRepository.deleteAllByIdInBatch(createdHotelIds)
		appAdminRepository.deleteAllByIdInBatch(createdAppAdminIds)
	}

	@Test
	fun `운영자를 등록하면 마스터의 호텔에 활성 운영자로 아이디는 소문자, 이름은 앞뒤 공백을 지워 저장하고 비밀번호는 입력한 그대로 해시해 201로 응답한다`() {
		val password = " New pass 1 "

		val data = create(createBody("loginId" to " New-Operator-$suffix@Test.LOCAL\t", "name" to " 김운영 ", "password" to password))
			.andExpectSuccess(HttpStatus.CREATED)

		val saved = hotelAdminRepository.findWithHotelById(data["id"].longValue())!!
		assertThat(data).isEqualTo(operatorJson(checkNotNull(saved.id), "new-operator-$suffix@test.local", "김운영", true, 0))
		assertThat(listOf(saved.hotel.id, saved.role, saved.active, saved.credentialVersion, saved.version))
			.containsExactly(hotel.id, HotelAdminRole.OPERATOR, true, 0L, 0L)
		assertThat(passwordEncoder.matches(password, saved.passwordHash)).isTrue()
		assertThat(passwordEncoder.matches(password.trim(), saved.passwordHash)).isFalse()
	}

	@Test
	fun `등록한 운영자를 조회하면 비밀번호 없이 아이디, 이름, 활성 여부, version을 200으로 응답한다`() {
		val id = create(createBody()).andExpectSuccess(HttpStatus.CREATED)["id"].longValue()

		val data = getOperator(id).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(operatorJson(id, operatorLoginId, OPERATOR_NAME, true, 0))
	}

	@ParameterizedTest
	@ValueSource(strings = ["master-%s@test.local", "other-master-%s@test.local", "other-operator-%s@test.local", " OTHER-OPERATOR-%s@Test.Local ", "inactive-%s@test.local"])
	fun `아이디를 마스터, 다른 호텔, 비활성 계정을 포함한 호텔 계정이 쓰고 있으면 대소문자와 앞뒤 공백과 관계없이 409 LOGIN_ID_DUPLICATED로 응답하고 등록하지 않는다`(loginId: String) {
		deactivate(saveHotelAdmin(hotel, "inactive-$suffix@test.local", OPERATOR_NAME, HotelAdminRole.OPERATOR))
		val before = operatorIds()

		create(createBody("loginId" to loginId.format(suffix))).andExpectError(AccountErrorCode.LOGIN_ID_DUPLICATED)

		assertThat(operatorIds()).isEqualTo(before)
	}

	@Test
	fun `전체 어드민 계정과 같은 이메일도 운영자 아이디로 쓸 수 있다`() {
		createdAppAdminIds += checkNotNull(appAdminRepository.save(AppAdmin(operatorLoginId, "password-hash", "어드민")).id)

		val data = create(createBody()).andExpectSuccess(HttpStatus.CREATED)

		assertThat(data["loginId"].stringValue()).isEqualTo(operatorLoginId)
	}

	@Test
	fun `같은 아이디로 동시에 등록하면 하나만 201로 등록되고 나머지는 409 LOGIN_ID_DUPLICATED로 응답한다`() {
		val responses = concurrently { index -> create(createBody("name" to "동시 등록 $index")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.CREATED.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, AccountErrorCode.LOGIN_ID_DUPLICATED)
		val winner = json(responses.single { it.status == HttpStatus.CREATED.value() })["data"]
		assertThat(operatorIds()).containsExactly(winner["id"].longValue())
	}

	@ParameterizedTest
	@MethodSource("loginIdErrors")
	fun `아이디는 앞뒤 공백을 지운 뒤 빈 값, 이메일 형식, 길이 순으로 오류 하나만 응답하고 등록하지 않는다`(loginId: String, messageKey: String) {
		val expected = if (messageKey == MAX_LENGTH) maxLength(HotelAdmin.LOGIN_ID_MAX_LENGTH) else message(messageKey)

		create(createBody("loginId" to loginId)).andExpectError(CommonErrorCode.INVALID_INPUT, "loginId" to expected)
		assertThat(operatorIds()).isEmpty()
	}

	@ParameterizedTest
	@ValueSource(strings = ["", " ", "\t", "　"])
	fun `이름이 비어 있거나 공백만 있으면 필수 입력 메시지로 400 응답한다`(name: String) {
		create(createBody("name" to name)).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to message(REQUIRED))
	}

	@Test
	fun `아이디와 이름의 최대 길이는 앞뒤 공백을 지운 값으로 세고 넘으면 최대 길이 메시지로 400 응답한다`() {
		val loginId = "$suffix@test." + "d".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH - "$suffix@test.".length)
		val name = "가".repeat(HotelAdmin.NAME_MAX_LENGTH)

		create(createBody("name" to "${name}가")).andExpectError(CommonErrorCode.INVALID_INPUT, "name" to maxLength(HotelAdmin.NAME_MAX_LENGTH))
		val data = create(createBody("loginId" to " $loginId ", "name" to " $name ")).andExpectSuccess(HttpStatus.CREATED)

		assertThat(listOf(data["loginId"].stringValue(), data["name"].stringValue())).containsExactly(loginId, name)
	}

	@ParameterizedTest
	@ValueSource(strings = ["", " ", "        ", "\t\n"])
	fun `비밀번호가 비어 있거나 공백만 있으면 비밀번호 규칙 메시지 없이 필수 입력 메시지 하나로 400 응답한다`(password: String) {
		create(createBody("password" to password)).andExpectError(CommonErrorCode.INVALID_INPUT, "password" to message(REQUIRED))
	}

	@ParameterizedTest
	@ValueSource(
		strings = [
			"abcdefgh", "12345678", "abc1234", "a1bcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm", "비밀번호abc123", "abc123\t45",
		],
	)
	fun `비밀번호가 8~64자, 영문과 숫자 포함, 영문 자판 글자 규칙을 어기면 비밀번호 규칙 메시지 하나로 400 응답한다`(password: String) {
		create(createBody("password" to password)).andExpectError(CommonErrorCode.INVALID_INPUT, "password" to message(PASSWORD))
		assertThat(operatorIds()).isEmpty()
	}

	@ParameterizedTest
	@ValueSource(strings = ["loginId", "name", "password"])
	fun `필수 항목이 없거나 null이면 필수 입력 메시지로 400 응답한다`(field: String) {
		create(createBody() - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		create(createBody(field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
	}

	@ParameterizedTest
	@MethodSource("typeMismatches")
	fun `항목에 다른 타입을 보내면 형식 메시지로 400 응답한다`(field: String, value: Any) {
		create(createBody(field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
	}

	@ParameterizedTest
	@ValueSource(strings = ["role", "active", "hotelId"])
	fun `문서에 없는 역할, 활성 여부, 호텔 항목을 보내면 알 수 없는 항목 메시지로 400 응답하고 등록하지 않는다`(field: String) {
		create(createBody(field to "x")).andExpectError(CommonErrorCode.INVALID_INPUT, field to message("validation.unknown-field"))
		assertThat(operatorIds()).isEmpty()
	}

	@Test
	fun `아이디, 이름, 비밀번호의 검증 오류를 필드마다 하나씩 함께 응답한다`() {
		create(createBody("loginId" to "not-an-email", "name" to " ", "password" to "short"))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "loginId" to message(EMAIL), "name" to message(REQUIRED), "password" to message(PASSWORD))
	}

	@Test
	fun `없는 id, 다른 호텔의 계정, 마스터 자신의 id로 조회하면 모두 404 HOTEL_OPERATOR_NOT_FOUND로 응답한다`() {
		listOf(MISSING_ID, checkNotNull(otherOperator.id), checkNotNull(otherMaster.id), checkNotNull(master.id)).forEach { id ->
			getOperator(id).andExpectError(AccountErrorCode.HOTEL_OPERATOR_NOT_FOUND)
		}
	}

	@Test
	fun `목록은 기본값 page 0, size 10으로 마스터의 호텔 운영자만 활성·비활성 모두 최근 등록 순으로 조회한다`() {
		val ids = saveOperators(11)
		deactivate(hotelAdminRepository.findById(ids[3]).orElseThrow())

		val data = getOperators().andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.reversed().take(10))
		assertThat(data["items"][0]).isEqualTo(operatorJson(ids.last(), "list-11-$suffix@test.local", "목록 11", true, 0))
		assertThat(data["items"][7]["active"].booleanValue()).isFalse()
		assertThat(pageInfo(data)).containsExactly(0, 10, 11, 2)
	}

	@Test
	fun `page와 size로 원하는 페이지를 조회한다`() {
		val ids = saveOperators(7)

		val data = getOperators("page" to "1", "size" to "3").andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.reversed().subList(3, 6))
		assertThat(pageInfo(data)).containsExactly(1, 3, 7, 3)
	}

	@ParameterizedTest
	@CsvSource(
		"page, -1, validation.min, 0",
		"page, 100, validation.max, 99",
		"size, 0, validation.min, 1",
		"size, 101, validation.max, 100",
	)
	fun `범위를 벗어난 page와 size는 파라미터 이름과 범위 메시지로 400 응답한다`(parameter: String, value: String, messageKey: String, bound: String) {
		getOperators(parameter to value).andExpectError(CommonErrorCode.INVALID_INPUT, parameter to message(messageKey).replace("{value}", bound))
	}

	@Test
	fun `active를 true나 false로 보내면 그 상태의 운영자만 조회한다`() {
		val active = checkNotNull(saveHotelAdmin(hotel, operatorLoginId, OPERATOR_NAME, HotelAdminRole.OPERATOR).id)
		val inactive = checkNotNull(saveHotelAdmin(hotel, "inactive-$suffix@test.local", OPERATOR_NAME, HotelAdminRole.OPERATOR).also(::deactivate).id)

		assertThat(itemIds(getOperators("active" to "true").andExpectSuccess(HttpStatus.OK))).containsExactly(active)
		assertThat(itemIds(getOperators("active" to "false").andExpectSuccess(HttpStatus.OK))).containsExactly(inactive)
		assertThat(itemIds(getOperators().andExpectSuccess(HttpStatus.OK))).containsExactly(inactive, active)
	}

	@ParameterizedTest
	@ValueSource(strings = ["1", "0", "yes", "no", "on", "off", "TRUE", "True", "FALSE", "", " true", "false ", "active", "2"])
	fun `active가 소문자 true나 false가 아니면 빈 값과 앞뒤 공백을 포함해 파라미터 이름과 형식 메시지 하나로 400 응답한다`(value: String) {
		getOperators("active" to value).andExpectError(CommonErrorCode.INVALID_INPUT, "active" to message(TYPE))
	}

	@Test
	fun `검색어가 이름이나 아이디에 들어 있는 운영자를 앞뒤 공백을 지우고 대소문자 구분 없이 찾고 active와 함께 거른다`() {
		val byName = checkNotNull(saveHotelAdmin(hotel, "first-$suffix@test.local", "Front Desk", HotelAdminRole.OPERATOR).id)
		val byLoginId = checkNotNull(saveHotelAdmin(hotel, "front-$suffix@test.local", OPERATOR_NAME, HotelAdminRole.OPERATOR).id)
		val inactive = checkNotNull(saveHotelAdmin(hotel, "night-$suffix@test.local", "FRONT 야간", HotelAdminRole.OPERATOR).also(::deactivate).id)
		saveHotelAdmin(hotel, "clean-$suffix@test.local", "청소", HotelAdminRole.OPERATOR)
		saveHotelAdmin(otherMaster.hotel, "front-other-$suffix@test.local", "Front", HotelAdminRole.OPERATOR)

		val all = getOperators("keyword" to " fRoNt ").andExpectSuccess(HttpStatus.OK)
		val activeOnly = getOperators("keyword" to "FRONT", "active" to "true").andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(all)).containsExactly(inactive, byLoginId, byName)
		assertThat(pageInfo(all)).containsExactly(0, 10, 3, 1)
		assertThat(itemIds(activeOnly)).containsExactly(byLoginId, byName)
	}

	@Test
	fun `마스터의 이름이나 아이디가 검색어에 맞아도 목록에 나오지 않는다`() {
		saveOperators(1)

		assertThat(itemIds(getOperators("keyword" to "master-$suffix").andExpectSuccess(HttpStatus.OK))).isEmpty()
		assertThat(itemIds(getOperators("keyword" to MASTER_NAME).andExpectSuccess(HttpStatus.OK))).isEmpty()
	}

	@ParameterizedTest
	@ValueSource(strings = ["", "   ", "　"])
	fun `검색어가 비어 있거나 공백만 있으면 거르지 않고 전체 목록을 조회한다`(keyword: String) {
		val ids = saveOperators(3)

		assertThat(itemIds(getOperators("keyword" to keyword).andExpectSuccess(HttpStatus.OK))).containsExactlyElementsOf(ids.reversed())
	}

	@ParameterizedTest
	@CsvSource("'50%', '50원'", "'a_b', 'axb'", "'c\\d', 'cd'")
	fun `검색어의 퍼센트, 밑줄, 역슬래시는 와일드카드가 아니라 글자 그대로 찾는다`(literal: String, decoy: String) {
		val target = checkNotNull(saveHotelAdmin(hotel, "target-$suffix@test.local", "운영 $literal", HotelAdminRole.OPERATOR).id)
		saveHotelAdmin(hotel, "decoy-$suffix@test.local", "운영 $decoy", HotelAdminRole.OPERATOR)

		assertThat(itemIds(getOperators("keyword" to literal).andExpectSuccess(HttpStatus.OK))).containsExactly(target)
	}

	@Test
	fun `검색어는 앞뒤 공백을 지운 길이로 세어 100자를 넘으면 최대 길이 메시지로 400 응답한다`() {
		val max = AccountHotelOperatorHotelAdminController.KEYWORD_MAX_LENGTH

		getOperators("keyword" to " ${"가".repeat(max)} ").andExpectSuccess(HttpStatus.OK)
		getOperators("keyword" to "가".repeat(max + 1)).andExpectError(CommonErrorCode.INVALID_INPUT, "keyword" to maxLength(max))
	}

	@Test
	fun `로그인하지 않으면 운영자 API는 401 UNAUTHORIZED로 응답하고 등록하지 않는다`() {
		mockMvc.get(OPERATORS).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get("$OPERATORS/${otherOperator.id}").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.post(OPERATORS) { withCsrf(); jsonBody(createBody()) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		assertThat(operatorIds()).isEmpty()
	}

	@Test
	fun `마스터가 아닌 운영자 계정과 전체 어드민 역할로는 운영자 API를 쓸 수 없어 403 FORBIDDEN으로 응답한다`() {
		val operator = HotelAdminPrincipal.from(saveHotelAdmin(hotel, "logged-in-$suffix@test.local", OPERATOR_NAME, HotelAdminRole.OPERATOR))
		val appAdmin = User.withUsername(USERNAME).password(PASSWORD_HASH).roles(Role.APP_ADMIN.name).build()

		listOf(operator, appAdmin).forEach { principal ->
			getOperators(principal = principal).andExpectError(CommonErrorCode.FORBIDDEN)
			getOperator(checkNotNull(master.id), principal).andExpectError(CommonErrorCode.FORBIDDEN)
			create(createBody(), principal).andExpectError(CommonErrorCode.FORBIDDEN)
		}
		assertThat(operatorIds()).containsExactly(operator.id)
	}

	@Test
	fun `CSRF 토큰 없이 등록하면 403 INVALID_CSRF_TOKEN으로 응답하고 등록하지 않는다`() {
		mockMvc.post(OPERATORS) { with(user(masterPrincipal)); jsonBody(createBody()) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		assertThat(operatorIds()).isEmpty()
	}

	@Test
	fun `운영자 API 문서는 account 태그에 마스터 전용 operation과 낼 수 있는 계정 에러를 예시로 보여준다`() {
		val docs = apiDocs()
		val operators = docs["paths"][OPERATORS]
		val operations = listOf(operators["post"], operators["get"], docs["paths"]["$OPERATORS/{operatorId}"]["get"])

		assertThat(operations.map { it["operationId"].stringValue() }).containsExactly("createHotelOperator", "getHotelOperators", "getHotelOperator")
		assertThat(operations.map { op -> op["tags"].values().map { it.stringValue() } }).containsOnly(listOf("account"))
		assertThat(docs["tags"].values().single { it["name"].stringValue() == "account" }["description"].stringValue())
			.isEqualTo(message("openapi.hotel-admin.tag.account"))
		operations.forEach { operation ->
			assertThat(errorCodes(operation, HttpStatus.UNAUTHORIZED)).containsExactly(CommonErrorCode.UNAUTHORIZED.code)
			assertThat(errorCodes(operation, HttpStatus.FORBIDDEN)).contains(CommonErrorCode.FORBIDDEN.code)
		}
		assertThat(operators["post"]["responses"].propertyNames()).containsExactlyInAnyOrder("201", "400", "401", "403", "409", "500")
		assertThat(errorCodes(operators["post"], HttpStatus.CONFLICT)).containsExactly(AccountErrorCode.LOGIN_ID_DUPLICATED.code)
		assertThat(operators["get"]["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(errorCodes(operations[2], HttpStatus.NOT_FOUND)).containsExactly(AccountErrorCode.HOTEL_OPERATOR_NOT_FOUND.code)
		assertThat(operations[2]["parameters"].values().map { it["name"].stringValue() }).containsExactly("operatorId")
	}

	@Test
	fun `운영자 목록 문서는 검색어, active, page·size 파라미터와 모든 필드가 필수인 페이지 응답 스키마를 보여준다`() {
		val docs = apiDocs()
		val getOperators = docs["paths"][OPERATORS]["get"]
		val parameters = getOperators["parameters"].values().associateBy { it["name"].stringValue() }
		val schemas = docs["components"]["schemas"]

		assertThat(parameters.keys).containsExactly("keyword", "active", "page", "size")
		assertThat(parameters.values.map { it["description"].stringValue() })
			.containsExactlyElementsOf(parameters.keys.map { message("openapi.hotel-admin.operation.getHotelOperators.parameter.$it") })
		assertThat(parameters.values.map { it["required"].booleanValue() }).containsOnly(false)
		assertThat(parameters.getValue("keyword")["schema"]).isEqualTo(json("""{"type":"string","maxLength":100,"minLength":0}"""))
		assertThat(parameters.getValue("active")["schema"]).isEqualTo(json("""{"type":"boolean"}"""))
		assertThat(parameters.getValue("page")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":0,"minimum":0,"maximum":99}"""))
		assertThat(parameters.getValue("size")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":10,"minimum":1,"maximum":100}"""))
		assertThat(getOperators["responses"]["200"]["content"][JSON]["schema"])
			.isEqualTo(schemaRef("ApiResponsePageResponseAccountHotelOperatorHotelAdminResponse"))
		val page = schemas["PageResponseAccountHotelOperatorHotelAdminResponse"]
		assertThat(required(page)).containsExactlyInAnyOrder("items", "page", "size", "totalElements", "totalPages")
		assertThat(page["properties"]["items"]["items"]).isEqualTo(schemaRef("AccountHotelOperatorHotelAdminResponse"))
	}

	@Test
	fun `운영자 응답 문서는 모든 필드가 필수이고 등록 요청 문서는 아이디의 이메일 형식과 길이, 이름 길이, 비밀번호 규칙을 보여준다`() {
		val docs = apiDocs()
		val schemas = docs["components"]["schemas"]
		val request = schemas["AccountHotelOperatorCreateHotelAdminRequest"]
		val rules = listOf("loginId", "name", "password").associateWith { field ->
			listOf("minLength", "maxLength", "pattern").map { request["properties"][field][it]?.asString() }
		}

		assertThat(docs["paths"][OPERATORS]["post"]["responses"]["201"]["content"][JSON]["schema"])
			.isEqualTo(schemaRef("ApiResponseAccountHotelOperatorHotelAdminResponse"))
		assertThat(required(schemas["AccountHotelOperatorHotelAdminResponse"])).containsExactlyInAnyOrder("id", "loginId", "name", "active", "version")
		assertThat(request["properties"].propertyNames()).containsExactlyInAnyOrder("loginId", "name", "password")
		assertThat(required(request)).containsExactlyInAnyOrder("loginId", "name", "password")
		assertThat(rules).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"loginId" to listOf("1", HotelAdmin.LOGIN_ID_MAX_LENGTH.toString(), LoginId.PATTERN),
				"name" to listOf("1", HotelAdmin.NAME_MAX_LENGTH.toString(), null),
				"password" to listOf(Password.MIN_LENGTH.toString(), Password.MAX_LENGTH.toString(), Password.PATTERN),
			),
		)
	}

	private fun create(body: Map<String, Any?>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.post(OPERATORS) {
			with(user(principal))
			withCsrf()
			jsonBody(body)
		}

	private fun getOperators(vararg params: Pair<String, String>, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get(OPERATORS) {
			with(user(principal))
			params.forEach { (name, value) -> param(name, value) }
		}

	private fun getOperator(id: Long, principal: UserDetails = masterPrincipal): ResultActionsDsl =
		mockMvc.get("$OPERATORS/$id") { with(user(principal)) }

	private fun MockHttpServletRequestDsl.withCsrf() {
		cookie(xsrf)
		header(XSRF_HEADER, xsrf.value)
	}

	private fun MockHttpServletRequestDsl.jsonBody(body: Map<String, Any?>) {
		contentType = MediaType.APPLICATION_JSON
		content = jsonMapper.writeValueAsString(body)
	}

	private fun createBody(vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>("loginId" to operatorLoginId, "name" to OPERATOR_NAME, "password" to NEW_PASSWORD) + overrides

	private fun saveHotel(name: String): Hotel =
		hotelRepository.save(Hotel(name, "서울 $suffix", PHONE, null)).also { createdHotelIds += checkNotNull(it.id) }

	private fun saveHotelAdmin(hotel: Hotel, loginId: String, name: String, role: HotelAdminRole): HotelAdmin =
		hotelAdminRepository.save(HotelAdmin(hotel, loginId, PASSWORD_HASH, name, role))

	private fun saveOperators(count: Int): List<Long> =
		(1..count).map { checkNotNull(saveHotelAdmin(hotel, "list-$it-$suffix@test.local", "목록 $it", HotelAdminRole.OPERATOR).id) }

	private fun deactivate(hotelAdmin: HotelAdmin) {
		jdbcTemplate.update("update hotel_admin set active = false where id = ?", hotelAdmin.id)
	}

	private fun operatorIds(): List<Long> =
		jdbcTemplate.queryForList(SELECT_OPERATOR_IDS, Long::class.javaObjectType, hotel.id).filterNotNull()

	private fun <T> concurrently(request: (Int) -> T): List<T> {
		val start = CountDownLatch(1)
		val futures = (0 until CONCURRENT_REQUESTS).map { index -> executor.submit(Callable { start.await(); request(index) }) }
		start.countDown()
		return futures.map { it.get(TIMEOUT_SECONDS, TimeUnit.SECONDS) }
	}

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus): JsonNode {
		val response = andReturn().response
		val body = json(response)
		assertThat(response.status).isEqualTo(status.value())
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

	private fun operatorJson(id: Long, loginId: String, name: String, active: Boolean, version: Long): JsonNode =
		json(jsonMapper.writeValueAsString(linkedMapOf("id" to id, "loginId" to loginId, "name" to name, "active" to active, "version" to version)))

	private fun itemIds(data: JsonNode): List<Long> = data["items"].values().map { it["id"].longValue() }

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(HOTEL_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

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
		private const val OPERATORS = ApiPaths.HOTEL_ADMIN + ApiPaths.OPERATORS
		private const val HOTEL_ADMIN_ME = ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + "/me"
		private const val HOTEL_ADMIN_DOCS = "/v3/api-docs/hotel-admin"
		private const val PHONE = "02-1234-5678"
		private const val PASSWORD_HASH = "password-hash"
		private const val MASTER_NAME = "마스터"
		private const val OPERATOR_NAME = "운영자"
		private const val USERNAME = "tester"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val REQUIRED = "validation.required"
		private const val TYPE = "validation.type"
		private const val MAX_LENGTH = "validation.max-length"
		private const val EMAIL = "validation.email"
		private const val PASSWORD = "validation.password"
		private const val NEW_PASSWORD = "new-password-1"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val CONCURRENT_REQUESTS = 2
		private const val TIMEOUT_SECONDS = 10L
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val SELECT_OPERATOR_IDS = "select id from hotel_admin where hotel_id = ? and role = 'OPERATOR' order by id"

		@JvmStatic
		fun loginIdErrors(): List<Arguments> {
			val tooLong = "a".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH - "@test.local".length + 1) + "@test.local"
			return listOf(
				Arguments.of("", REQUIRED),
				Arguments.of(" \t ", REQUIRED),
				Arguments.of("　", REQUIRED),
				Arguments.of("operator", EMAIL),
				Arguments.of("operator@test", EMAIL),
				Arguments.of("oper ator@test.local", EMAIL),
				Arguments.of("홍길동@x.com", EMAIL),
				Arguments.of("a".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH + 1), EMAIL),
				Arguments.of(" $tooLong ", MAX_LENGTH),
			)
		}

		@JvmStatic
		fun typeMismatches(): List<Arguments> = listOf(
			Arguments.of("loginId", 123),
			Arguments.of("loginId", listOf("operator@test.local")),
			Arguments.of("name", true),
			Arguments.of("password", 12345678),
		)
	}
}
