package com.marco.assignment.handys.urbanstay.hotel.controller.appadmin

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.account.repository.AppAdminRepository
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.common.validation.Password
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.hotel.repository.HotelRepository
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertTimeout
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
import org.springframework.mock.web.MockHttpServletRequest
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
import java.time.Duration
import java.util.Locale
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class)
class HotelAppAdminControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var hotelRepository: HotelRepository

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	@Autowired
	private lateinit var appAdminRepository: AppAdminRepository

	private val executor = Executors.newFixedThreadPool(2)

	private val suffix = UUID.randomUUID().toString().take(8)
	private val name = "어반스테이 $suffix"
	private val address = "서울특별시 강남구 테헤란로 $suffix"
	private val masterSequence = AtomicInteger()

	private val xsrf: Cookie by lazy { checkNotNull(mockMvc.get(HOTELS).andReturn().response.getCookie(XSRF_COOKIE)) }

	private lateinit var existingIds: Set<Long>

	@BeforeEach
	fun rememberExistingHotels() {
		existingIds = hotelIds()
	}

	@AfterEach
	fun deleteCreatedHotels() {
		executor.shutdownNow()
		val createdIds = hotelIds() - existingIds
		createdIds.forEach { jdbcTemplate.update(DELETE_HOTEL_ADMINS, it) }
		hotelRepository.deleteAllByIdInBatch(createdIds)
	}

	@Test
	fun `호텔을 등록하면 값의 앞뒤 공백을 지워 저장하고 공백만 있는 소개는 null로 저장해 201로 응답한다`() {
		val data = create(createBody("name" to "  $name ", "address" to "\t$address\n", "phone" to " $PHONE ", "description" to " 　 "))
			.andExpectSuccess(HttpStatus.CREATED)

		val id = data["id"].longValue()
		assertThat(data).isEqualTo(hotelJson(id, name, address, PHONE, null, 0))
		assertThat(hotelJson(hotelRepository.findById(id).orElseThrow())).isEqualTo(data)
	}

	@ParameterizedTest
	@ValueSource(booleans = [true, false])
	fun `소개는 보내지 않거나 null이어도 등록한다`(omitted: Boolean) {
		val body = if (omitted) createBody() - "description" else createBody("description" to null)

		assertThat(create(body).andExpectSuccess(HttpStatus.CREATED)["description"].isNull).isTrue()
	}

	@Test
	fun `최대 길이는 앞뒤 공백을 지운 값으로 세어 최대 길이의 값은 등록한다`() {
		val longName = "가".repeat(Hotel.NAME_MAX_LENGTH - suffix.length) + suffix
		val longAddress = "나".repeat(Hotel.ADDRESS_MAX_LENGTH - suffix.length) + suffix
		val longPhone = "0-1-2-3-4-5-6-7-8-9-"
		val longDescription = "다".repeat(Hotel.DESCRIPTION_MAX_LENGTH)

		val data = create(createBody("name" to " $longName ", "address" to " $longAddress ", "phone" to " $longPhone ", "description" to " $longDescription "))
			.andExpectSuccess(HttpStatus.CREATED)

		assertThat(listOf(data["name"], data["address"], data["phone"], data["description"]).map { it.stringValue().length })
			.containsExactly(Hotel.NAME_MAX_LENGTH, Hotel.ADDRESS_MAX_LENGTH, Hotel.PHONE_MAX_LENGTH, Hotel.DESCRIPTION_MAX_LENGTH)
	}

	@Test
	fun `앞뒤 공백을 지워도 최대 길이를 넘으면 필드마다 최대 길이 메시지로 400 응답한다`() {
		val body = createBody(
			"name" to "가".repeat(Hotel.NAME_MAX_LENGTH + 1),
			"address" to "나".repeat(Hotel.ADDRESS_MAX_LENGTH + 1),
			"phone" to "0-1-2-3-4-5-6-7-8-9-0",
			"description" to "다".repeat(Hotel.DESCRIPTION_MAX_LENGTH + 1),
		)

		create(body).andExpectError(
			CommonErrorCode.INVALID_INPUT,
			"name" to maxLength(Hotel.NAME_MAX_LENGTH),
			"address" to maxLength(Hotel.ADDRESS_MAX_LENGTH),
			"phone" to maxLength(Hotel.PHONE_MAX_LENGTH),
			"description" to maxLength(Hotel.DESCRIPTION_MAX_LENGTH),
		)
		assertThat(hotelIds() - existingIds).isEmpty()
	}

	@Test
	fun `빈 값과 공백만 있는 필수 값은 필드마다 필수 입력 메시지 하나로 400 응답한다`() {
		create(createBody("name" to "", "address" to " \t ", "phone" to "　"))
			.andExpectError(
				CommonErrorCode.INVALID_INPUT,
				"name" to message(REQUIRED),
				"address" to message(REQUIRED),
				"phone" to message(REQUIRED),
			)
	}

	@ParameterizedTest
	@ValueSource(strings = ["", "  ", "\t", "　"])
	fun `전화번호가 비어 있거나 공백만 있으면 형식 메시지 없이 필수 입력 메시지 하나로 400 응답한다`(phone: String) {
		create(createBody("phone" to phone)).andExpectError(CommonErrorCode.INVALID_INPUT, "phone" to message(REQUIRED))
	}

	@ParameterizedTest
	@ValueSource(
		strings = [
			"1234567", "123456789012", "02)1234-5678", "+82-2-1234-5678", "02 1234 5678", "02.1234.5678", "--------", "０２-１２３４-５６７８",
			"abcdefghijklmnopqrstuvwxy", "0212345678901234567890",
		],
	)
	fun `전화번호에 숫자와 - 밖의 문자가 있거나 숫자가 8~11개가 아니면 길이와 관계없이 전화번호 형식 메시지 하나로 400 응답한다`(phone: String) {
		create(createBody("phone" to phone)).andExpectError(CommonErrorCode.INVALID_INPUT, "phone" to message(PHONE_FORMAT))
	}

	@ParameterizedTest
	@MethodSource("phoneErrors")
	fun `등록과 수정 모두 전화번호 오류는 빈 값, 형식, 길이 순으로 하나만 응답한다`(phone: String, messageKey: String) {
		val hotelId = checkNotNull(saveHotel().id)
		val expected = if (messageKey == MAX_LENGTH) maxLength(Hotel.PHONE_MAX_LENGTH) else message(messageKey)

		create(createBody("name" to "새 호텔 $suffix", "phone" to phone)).andExpectError(CommonErrorCode.INVALID_INPUT, "phone" to expected)
		update(hotelId, updateBody(0, "phone" to phone)).andExpectError(CommonErrorCode.INVALID_INPUT, "phone" to expected)
	}

	@ParameterizedTest
	@ValueSource(strings = ["1588-1234", "02-1234-5678", "010-1234-5678", "01012345678", "02--1234-5678"])
	fun `숫자와 -만 있고 숫자가 8~11개인 전화번호는 입력한 모양 그대로 저장한다`(phone: String) {
		assertThat(create(createBody("phone" to phone)).andExpectSuccess(HttpStatus.CREATED)["phone"].stringValue()).isEqualTo(phone)
	}

	@ParameterizedTest
	@MethodSource("typeMismatches")
	fun `문자열 항목에 다른 타입을 보내면 바꾸지 않고 형식 메시지로 400 응답한다`(field: String, value: Any) {
		create(createBody(field to value)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(TYPE))
	}

	@ParameterizedTest
	@ValueSource(strings = ["name", "address", "phone", "master"])
	fun `필수 항목이 없거나 null이면 필수 입력 메시지로 400 응답한다`(field: String) {
		create(createBody() - field).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
		create(createBody(field to null)).andExpectError(CommonErrorCode.INVALID_INPUT, field to message(REQUIRED))
	}

	@Test
	fun `문서에 없는 항목을 보내면 알 수 없는 항목 메시지로 400 응답한다`() {
		create(createBody("checkInTime" to "15:00"))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "checkInTime" to message("validation.unknown-field"))
	}

	@Test
	fun `앞뒤 공백을 지운 이름과 주소가 모두 같은 호텔을 등록하면 409 HOTEL_DUPLICATED로 응답한다`() {
		create(createBody()).andExpectSuccess(HttpStatus.CREATED)

		create(createBody("name" to " $name ", "address" to "$address  ", "phone" to OTHER_PHONE))
			.andExpectError(HotelErrorCode.HOTEL_DUPLICATED)
		assertThat(hotelsNamed(name)).hasSize(1)
	}

	@ParameterizedTest
	@CsvSource("'', ' 2층'", "' (본점)', ''")
	fun `이름이나 주소 중 하나만 같으면 다른 호텔로 등록한다`(nameSuffix: String, addressSuffix: String) {
		create(createBody()).andExpectSuccess(HttpStatus.CREATED)

		create(createBody("name" to name + nameSuffix, "address" to address + addressSuffix)).andExpectSuccess(HttpStatus.CREATED)
	}

	@Test
	fun `대소문자만 다른 이름은 다른 호텔로 등록한다`() {
		create(createBody("name" to "Urbanstay $suffix")).andExpectSuccess(HttpStatus.CREATED)

		create(createBody("name" to "URBANSTAY $suffix")).andExpectSuccess(HttpStatus.CREATED)
	}

	@Test
	fun `같은 등록 요청이 동시에 두 번 오면 하나만 201로 등록되고 나머지는 409 HOTEL_DUPLICATED로 응답한다`() {
		val body = createBody()

		val responses = concurrently { create(body).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.CREATED.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, HotelErrorCode.HOTEL_DUPLICATED)
		assertThat(hotelsNamed(name)).hasSize(1)
		assertThat(mastersWithLoginId(masterLoginId(body))).hasSize(1)
	}

	@Test
	fun `호텔을 등록하면 마스터 계정을 함께 만들어 아이디는 소문자로, 이름은 앞뒤 공백을 지워 저장하고 비밀번호는 입력한 그대로 해시해 저장한다`() {
		val loginId = "Master-$suffix@Test.LOCAL"
		val password = " Urbanstay 123! "

		val data = create(createBody("master" to masterBody("loginId" to " $loginId\t", "name" to " 홍길동 ", "password" to password)))
			.andExpectSuccess(HttpStatus.CREATED)

		assertThat(data).isEqualTo(hotelJson(hotelRepository.findById(data["id"].longValue()).orElseThrow()))
		val master = masterOf(data["id"].longValue())
		assertThat(listOf(master["login_id"], master["name"], master["role"], master["active"], master["credential_version"]))
			.containsExactly(loginId.lowercase(), "홍길동", "MASTER", true, 0L)
		val passwordHash = master["password_hash"] as String
		assertThat(passwordHash).startsWith("{bcrypt}").doesNotContain(password.trim())
		assertThat(passwordEncoder.matches(password, passwordHash)).isTrue()
		assertThat(passwordEncoder.matches(password.trim(), passwordHash)).isFalse()
	}

	@Test
	fun `영문 자판 글자로만 된 64자 비밀번호도 해시해 저장한다`() {
		val password = " 1aZ!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" + "x".repeat(28)

		val data = create(createBody("master" to masterBody("password" to password))).andExpectSuccess(HttpStatus.CREATED)

		assertThat(password).hasSize(Password.MAX_LENGTH)
		assertThat(passwordEncoder.matches(password, masterOf(data["id"].longValue())["password_hash"] as String)).isTrue()
	}

	@Test
	fun `마스터 아이디를 다른 호텔 계정이 쓰고 있으면 대소문자와 앞뒤 공백과 관계없이 409 LOGIN_ID_DUPLICATED로 응답하고 호텔을 저장하지 않는다`() {
		val loginId = "taken-$suffix@test.local"
		create(createBody("master" to masterBody("loginId" to loginId))).andExpectSuccess(HttpStatus.CREATED)

		create(createBody("name" to "다른 호텔 $suffix", "master" to masterBody("loginId" to " ${loginId.uppercase()} ")))
			.andExpectError(AccountErrorCode.LOGIN_ID_DUPLICATED)

		assertThat(hotelsNamed("다른 호텔 $suffix")).isEmpty()
		assertThat(mastersWithLoginId(loginId)).hasSize(1)
	}

	@Test
	fun `호텔과 마스터 아이디가 모두 중복이면 409 HOTEL_DUPLICATED로 응답한다`() {
		val body = createBody()
		create(body).andExpectSuccess(HttpStatus.CREATED)

		create(body).andExpectError(HotelErrorCode.HOTEL_DUPLICATED)
	}

	@Test
	fun `전체 어드민 계정과 같은 이메일도 마스터 아이디로 쓸 수 있다`() {
		val loginId = "app-admin-$suffix@test.local"
		val appAdmin = appAdminRepository.save(AppAdmin(loginId, "password-hash", "어드민"))
		try {
			create(createBody("master" to masterBody("loginId" to loginId))).andExpectSuccess(HttpStatus.CREATED)

			assertThat(mastersWithLoginId(loginId)).hasSize(1)
		} finally {
			appAdminRepository.deleteById(checkNotNull(appAdmin.id))
		}
	}

	@Test
	fun `서로 다른 호텔을 같은 마스터 아이디로 동시에 등록하면 하나만 201로 등록되고 나머지는 409 LOGIN_ID_DUPLICATED로 응답하며 진 쪽 호텔은 저장하지 않는다`() {
		val loginId = "concurrent-$suffix@test.local"
		val names = (0 until CONCURRENT_REQUESTS).map { "$name 동시 $it" }

		val responses = concurrently { index -> create(createBody("name" to names[index], "master" to masterBody("loginId" to loginId))).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.CREATED.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, AccountErrorCode.LOGIN_ID_DUPLICATED)
		val winnerId = json(responses.single { it.status == HttpStatus.CREATED.value() })["data"]["id"].longValue()
		assertThat(names.flatMap(::hotelsNamed).map { it.id }).containsExactly(winnerId)
		assertThat(mastersWithLoginId(loginId)).containsExactly(winnerId)
	}

	@ParameterizedTest
	@MethodSource("masterLoginIdErrors")
	fun `마스터 아이디는 앞뒤 공백을 지운 뒤 빈 값, 이메일 형식, 길이 순으로 오류 하나만 응답한다`(loginId: String, messageKey: String) {
		val expected = if (messageKey == MAX_LENGTH) maxLength(HotelAdmin.LOGIN_ID_MAX_LENGTH) else message(messageKey)

		create(createBody("master" to masterBody("loginId" to loginId))).andExpectError(CommonErrorCode.INVALID_INPUT, "master.loginId" to expected)
	}

	@ParameterizedTest
	@ValueSource(strings = ["a@b.com", "A.B+c@x-y.co.kr"])
	fun `영문 자판 글자로 된 이메일 형식의 마스터 아이디는 소문자로 바꿔 등록한다`(loginId: String) {
		val data = create(createBody("master" to masterBody("loginId" to loginId))).andExpectSuccess(HttpStatus.CREATED)

		assertThat(masterOf(data["id"].longValue())["login_id"]).isEqualTo(loginId.lowercase())
	}

	@Test
	fun `긴 형식 오류 아이디도 길이에 비례하는 시간 안에 이메일 형식 메시지 하나로 400 응답한다`() {
		val loginId = "a@" + ".".repeat(100_000) + "@"

		assertTimeout(Duration.ofSeconds(LONG_INPUT_TIMEOUT_SECONDS)) {
			create(createBody("master" to masterBody("loginId" to loginId)))
				.andExpectError(CommonErrorCode.INVALID_INPUT, "master.loginId" to message(EMAIL))
		}
	}

	@Test
	fun `마스터 아이디와 이름의 최대 길이는 앞뒤 공백을 지운 값으로 센다`() {
		val loginId = emailOfLength(HotelAdmin.LOGIN_ID_MAX_LENGTH)
		val masterName = "가".repeat(HotelAdmin.NAME_MAX_LENGTH)

		val data = create(createBody("master" to masterBody("loginId" to " $loginId ", "name" to " $masterName "))).andExpectSuccess(HttpStatus.CREATED)

		val master = masterOf(data["id"].longValue())
		assertThat(listOf(master["login_id"], master["name"])).containsExactly(loginId, masterName)
	}

	@ParameterizedTest
	@ValueSource(strings = ["", " ", "\t", "　"])
	fun `마스터 이름이 비어 있거나 공백만 있으면 필수 입력 메시지로 400 응답한다`(masterName: String) {
		create(createBody("master" to masterBody("name" to masterName))).andExpectError(CommonErrorCode.INVALID_INPUT, "master.name" to message(REQUIRED))
	}

	@Test
	fun `마스터 이름이 앞뒤 공백을 지워도 50자를 넘으면 최대 길이 메시지로 400 응답한다`() {
		create(createBody("master" to masterBody("name" to "가".repeat(HotelAdmin.NAME_MAX_LENGTH + 1))))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "master.name" to maxLength(HotelAdmin.NAME_MAX_LENGTH))
	}

	@ParameterizedTest
	@ValueSource(strings = ["", " ", "        ", "\t\n"])
	fun `마스터 비밀번호가 비어 있거나 공백만 있으면 비밀번호 규칙 메시지 없이 필수 입력 메시지 하나로 400 응답한다`(password: String) {
		create(createBody("master" to masterBody("password" to password))).andExpectError(CommonErrorCode.INVALID_INPUT, "master.password" to message(REQUIRED))
	}

	@ParameterizedTest
	@ValueSource(
		strings = [
			"abcdefgh", "12345678", "!@#$%^&*", "abc1234", "abc 123", "a1bcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm",
			"비밀번호abc123", "abc123\t45", "ａｂｃ１２３４５", "abcd1234é", "abcd1234 ",
		],
	)
	fun `마스터 비밀번호가 8~64자, 영문과 숫자 포함, 영문 자판 글자 규칙을 어기면 비밀번호 규칙 메시지 하나로 400 응답한다`(password: String) {
		create(createBody("master" to masterBody("password" to password))).andExpectError(CommonErrorCode.INVALID_INPUT, "master.password" to message(PASSWORD))
	}

	@ParameterizedTest
	@ValueSource(strings = ["abcdefg1", "1234567A", "  a1  b2  ", "P@ssw0rd!"])
	fun `영문과 숫자를 모두 넣은 8자 이상의 영문 자판 글자 비밀번호는 공백과 특수문자가 있어도 등록한다`(password: String) {
		val data = create(createBody("master" to masterBody("password" to password))).andExpectSuccess(HttpStatus.CREATED)

		assertThat(passwordEncoder.matches(password, masterOf(data["id"].longValue())["password_hash"] as String)).isTrue()
	}

	@ParameterizedTest
	@ValueSource(strings = ["loginId", "name", "password"])
	fun `마스터의 필수 항목이 없거나 null이면 master 아래 경로와 필수 입력 메시지로 400 응답한다`(field: String) {
		create(createBody("master" to masterBody() - field)).andExpectError(CommonErrorCode.INVALID_INPUT, "master.$field" to message(REQUIRED))
		create(createBody("master" to masterBody(field to null))).andExpectError(CommonErrorCode.INVALID_INPUT, "master.$field" to message(REQUIRED))
	}

	@ParameterizedTest
	@ValueSource(strings = ["loginId", "name", "password"])
	fun `마스터의 문자열 항목에 다른 타입을 보내면 master 아래 경로와 형식 메시지로 400 응답한다`(field: String) {
		create(createBody("master" to masterBody(field to 12345678))).andExpectError(CommonErrorCode.INVALID_INPUT, "master.$field" to message(TYPE))
	}

	@Test
	fun `master 안에 문서에 없는 항목을 보내면 master 아래 경로와 알 수 없는 항목 메시지로 400 응답한다`() {
		create(createBody("master" to masterBody("role" to "MASTER")))
			.andExpectError(CommonErrorCode.INVALID_INPUT, "master.role" to message("validation.unknown-field"))
	}

	@Test
	fun `호텔과 마스터 항목의 검증 오류를 필드마다 하나씩 함께 응답하고 아무것도 저장하지 않는다`() {
		create(createBody("name" to " ", "master" to masterBody("loginId" to "not-an-email", "name" to "", "password" to "short")))
			.andExpectError(
				CommonErrorCode.INVALID_INPUT,
				"name" to message(REQUIRED),
				"master.loginId" to message(EMAIL),
				"master.name" to message(REQUIRED),
				"master.password" to message(PASSWORD),
			)
		assertThat(hotelIds() - existingIds).isEmpty()
	}

	@Test
	fun `호텔을 조회하면 수정에 쓸 version과 함께 200으로 응답한다`() {
		val hotel = saveHotel()

		val data = mockMvc.get("$HOTELS/${hotel.id}") { loggedIn() }.andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(hotelJson(hotel))
	}

	@Test
	fun `없는 호텔을 조회하거나 수정하면 404 HOTEL_NOT_FOUND로 응답한다`() {
		mockMvc.get("$HOTELS/$MISSING_ID") { loggedIn() }.andExpectError(HotelErrorCode.HOTEL_NOT_FOUND)
		update(MISSING_ID, updateBody(0)).andExpectError(HotelErrorCode.HOTEL_NOT_FOUND)
	}

	@Test
	fun `조회한 version으로 수정하면 모든 항목을 앞뒤 공백을 지운 값으로 바꾸고 version을 올려 200으로 응답한다`() {
		val hotelId = checkNotNull(saveHotel().id)
		val newName = "어반스테이 역삼 $suffix"

		val data = update(hotelId, updateBody(0, "name" to " $newName ", "address" to "$address 2층 ", "phone" to " $OTHER_PHONE", "description" to "  "))
			.andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(hotelJson(hotelId, newName, "$address 2층", OTHER_PHONE, null, 1))
		assertThat(hotelJson(hotelRepository.findById(hotelId).orElseThrow())).isEqualTo(data)
	}

	@Test
	fun `이름과 주소를 그대로 두고 나머지 항목만 수정할 수 있다`() {
		val hotelId = checkNotNull(saveHotel().id)

		val data = update(hotelId, updateBody(0, "phone" to OTHER_PHONE)).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(hotelJson(hotelId, name, address, OTHER_PHONE, DESCRIPTION, 1))
	}

	@Test
	fun `바뀐 값이 없는 수정은 version을 올리지 않고 200으로 응답한다`() {
		val hotel = saveHotel()

		val data = update(checkNotNull(hotel.id), updateBody(0, "name" to " $name ")).andExpectSuccess(HttpStatus.OK)

		assertThat(data).isEqualTo(hotelJson(hotel))
	}

	@Test
	fun `다른 호텔과 이름과 주소가 모두 같아지게 수정하면 409 HOTEL_DUPLICATED로 응답하고 바꾸지 않는다`() {
		saveHotel()
		val other = saveHotel(name = "다른 호텔 $suffix")

		update(checkNotNull(other.id), updateBody(0, "name" to name)).andExpectError(HotelErrorCode.HOTEL_DUPLICATED)

		assertThat(hotelJson(hotelRepository.findById(checkNotNull(other.id)).orElseThrow())).isEqualTo(hotelJson(other))
	}

	@Test
	fun `같은 version으로 두 번 수정하면 먼저 수정한 쪽만 반영되고 나중 수정은 409 HOTEL_MODIFIED로 응답한다`() {
		val hotelId = checkNotNull(saveHotel().id)

		update(hotelId, updateBody(0, "description" to "먼저 수정")).andExpectSuccess(HttpStatus.OK)
		update(hotelId, updateBody(0, "description" to "나중 수정")).andExpectError(HotelErrorCode.HOTEL_MODIFIED)

		val hotel = hotelRepository.findById(hotelId).orElseThrow()
		assertThat(listOf(hotel.description, hotel.version)).containsExactly("먼저 수정", 1L)
	}

	@Test
	fun `같은 version으로 동시에 수정하면 하나만 200으로 반영되고 나머지는 409 HOTEL_MODIFIED로 응답한다`() {
		val hotelId = checkNotNull(saveHotel().id)

		val responses = concurrently { index -> update(hotelId, updateBody(0, "description" to "동시 수정 $index")).andReturn().response }

		assertThat(responses.map { it.status }).containsExactlyInAnyOrder(HttpStatus.OK.value(), HttpStatus.CONFLICT.value())
		assertError(responses.single { it.status == HttpStatus.CONFLICT.value() }, HotelErrorCode.HOTEL_MODIFIED)
		val winner = json(responses.single { it.status == HttpStatus.OK.value() })["data"]
		assertThat(hotelJson(hotelRepository.findById(hotelId).orElseThrow())).isEqualTo(winner)
		assertThat(winner["version"].longValue()).isEqualTo(1)
	}

	@ParameterizedTest
	@ValueSource(booleans = [true, false])
	fun `version 없이 수정하면 필수 입력 메시지로 400 응답한다`(omitted: Boolean) {
		val hotelId = checkNotNull(saveHotel().id)
		val body = if (omitted) updateBody(0) - "version" else updateBody(0, "version" to null)

		update(hotelId, body).andExpectError(CommonErrorCode.INVALID_INPUT, "version" to message(REQUIRED))
	}

	@Test
	fun `수정 요청도 등록과 같은 규칙으로 입력값을 검사한다`() {
		val hotelId = checkNotNull(saveHotel().id)

		update(hotelId, updateBody(0, "name" to " ", "address" to "나".repeat(Hotel.ADDRESS_MAX_LENGTH + 1), "phone" to "02-123", "description" to "다".repeat(Hotel.DESCRIPTION_MAX_LENGTH + 1)))
			.andExpectError(
				CommonErrorCode.INVALID_INPUT,
				"name" to message(REQUIRED),
				"address" to maxLength(Hotel.ADDRESS_MAX_LENGTH),
				"phone" to message(PHONE_FORMAT),
				"description" to maxLength(Hotel.DESCRIPTION_MAX_LENGTH),
			)
	}

	@Test
	fun `목록은 기본값 page 0, size 10으로 최근 등록한 호텔부터 조회한다`() {
		val ids = saveHotels(11)
		val total = hotelRepository.count()

		val data = mockMvc.get(HOTELS) { loggedIn() }.andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.reversed().take(10))
		assertThat(data["items"][0]).isEqualTo(hotelJson(hotelRepository.findById(ids.last()).orElseThrow()))
		assertThat(pageInfo(data)).containsExactly(0, 10, total, ceilDiv(total, 10))
	}

	@Test
	fun `page와 size로 원하는 페이지를 조회한다`() {
		val ids = saveHotels(11)
		val total = hotelRepository.count()

		val data = mockMvc.get(HOTELS) {
			loggedIn()
			param("page", "1")
			param("size", "5")
		}.andExpectSuccess(HttpStatus.OK)

		assertThat(itemIds(data)).containsExactlyElementsOf(ids.reversed().subList(5, 10))
		assertThat(pageInfo(data)).containsExactly(1, 5, total, ceilDiv(total, 5))
	}

	@ParameterizedTest
	@CsvSource("page, 0", "page, 99", "size, 1", "size, 100")
	fun `page와 size는 범위의 끝 값까지 받는다`(parameter: String, value: Int) {
		val data = mockMvc.get(HOTELS) {
			loggedIn()
			param(parameter, value.toString())
		}.andExpectSuccess(HttpStatus.OK)

		assertThat(data[parameter].intValue()).isEqualTo(value)
	}

	@ParameterizedTest
	@CsvSource(
		"page, -1, validation.min, 0",
		"page, 100, validation.max, 99",
		"page, 2147483647, validation.max, 99",
		"size, 0, validation.min, 1",
		"size, 101, validation.max, 100",
	)
	fun `범위를 벗어난 page와 size는 파라미터 이름과 범위 메시지로 400 응답한다`(parameter: String, value: String, messageKey: String, bound: String) {
		mockMvc.get(HOTELS) {
			loggedIn()
			param(parameter, value)
		}.andExpectError(CommonErrorCode.INVALID_INPUT, parameter to message(messageKey).replace("{value}", bound))
	}

	@Test
	fun `검색어가 이름에 들어 있는 호텔만 앞뒤 공백을 지우고 대소문자 구분 없이 최근 등록 순으로 조회한다`() {
		val first = checkNotNull(saveHotel("[강남] $suffix-Urbanstay").id)
		val second = checkNotNull(saveHotel("$suffix-URBANSTAY 역삼").id)
		saveHotel("$suffix-Hotel")

		val data = searchHotels(" ${suffix.uppercase()}-urbanStay ")

		assertThat(itemIds(data)).containsExactly(second, first)
		assertThat(pageInfo(data)).containsExactly(0, 10, 2, 1)
	}

	@Test
	fun `검색어에 맞는 호텔이 없으면 빈 목록으로 응답한다`() {
		saveHotel()

		val data = searchHotels("$suffix-없는 호텔")

		assertThat(itemIds(data)).isEmpty()
		assertThat(pageInfo(data)).containsExactly(0, 10, 0, 0)
	}

	@ParameterizedTest
	@ValueSource(strings = ["", "   ", "　"])
	fun `검색어가 비어 있거나 공백만 있으면 거르지 않고 전체 목록을 조회한다`(keyword: String) {
		val ids = saveHotels(3)
		val total = hotelRepository.count()

		val data = searchHotels(keyword)

		assertThat(itemIds(data)).startsWith(*ids.reversed().toTypedArray())
		assertThat(data["totalElements"].longValue()).isEqualTo(total)
	}

	@ParameterizedTest
	@CsvSource("'50%', '50원'", "'a_b', 'axb'", "'c\\d', 'cd'")
	fun `검색어의 퍼센트, 밑줄, 역슬래시는 와일드카드가 아니라 글자 그대로 찾는다`(literal: String, decoy: String) {
		val target = checkNotNull(saveHotel("$suffix $literal").id)
		saveHotel("$suffix $decoy")

		val data = searchHotels("$suffix $literal")

		assertThat(itemIds(data)).containsExactly(target)
	}

	@Test
	fun `검색어는 앞뒤 공백을 지운 길이로 세어 100자를 넘으면 최대 길이 메시지로 400 응답한다`() {
		searchHotels(" ${"가".repeat(Hotel.NAME_MAX_LENGTH)} ")

		mockMvc.get(HOTELS) {
			loggedIn()
			param("keyword", "가".repeat(Hotel.NAME_MAX_LENGTH + 1))
		}.andExpectError(CommonErrorCode.INVALID_INPUT, "keyword" to maxLength(Hotel.NAME_MAX_LENGTH))
	}

	@Test
	fun `검색 결과도 page와 size로 나눠 조회하고 전체 수와 페이지 수는 검색 결과 기준이다`() {
		val matched = (1..7).map { checkNotNull(saveHotel("$suffix 검색 $it").id) }
		saveHotels(2)

		val data = searchHotels("$suffix 검색", "page" to "1", "size" to "3")

		assertThat(itemIds(data)).containsExactlyElementsOf(matched.reversed().subList(3, 6))
		assertThat(pageInfo(data)).containsExactly(1, 3, 7, 3)
	}

	@Test
	fun `로그인하지 않으면 호텔 API는 401 UNAUTHORIZED로 응답한다`() {
		val hotelId = checkNotNull(saveHotel().id)

		mockMvc.get(HOTELS).andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.get("$HOTELS/$hotelId").andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.post(HOTELS) { withCsrf(); jsonBody(createBody("name" to "새 호텔 $suffix")) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		mockMvc.put("$HOTELS/$hotelId") { withCsrf(); jsonBody(updateBody(0, "phone" to OTHER_PHONE)) }.andExpectError(CommonErrorCode.UNAUTHORIZED)
		assertThat(hotelIds() - existingIds).containsExactly(hotelId)
		assertThat(hotelRepository.findById(hotelId).orElseThrow().phone).isEqualTo(PHONE)
	}

	@Test
	fun `호텔 운영자 역할로는 전체 어드민의 호텔 API를 쓸 수 없어 403 FORBIDDEN으로 응답한다`() {
		val hotelId = checkNotNull(saveHotel().id)

		mockMvc.get(HOTELS) { loggedIn(Role.HOTEL_ADMIN) }.andExpectError(CommonErrorCode.FORBIDDEN)
		mockMvc.get("$HOTELS/$hotelId") { loggedIn(Role.HOTEL_ADMIN) }.andExpectError(CommonErrorCode.FORBIDDEN)
		create(createBody("name" to "새 호텔 $suffix"), Role.HOTEL_ADMIN).andExpectError(CommonErrorCode.FORBIDDEN)
		update(hotelId, updateBody(0, "phone" to OTHER_PHONE), Role.HOTEL_ADMIN).andExpectError(CommonErrorCode.FORBIDDEN)
		assertThat(hotelIds() - existingIds).containsExactly(hotelId)
		assertThat(hotelRepository.findById(hotelId).orElseThrow().phone).isEqualTo(PHONE)
	}

	@Test
	fun `CSRF 토큰 없이 등록하거나 수정하면 403 INVALID_CSRF_TOKEN으로 응답하고 저장하지 않는다`() {
		val hotelId = checkNotNull(saveHotel().id)

		mockMvc.post(HOTELS) { loggedIn(); jsonBody(createBody("name" to "새 호텔 $suffix")) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		mockMvc.put("$HOTELS/$hotelId") { loggedIn(); jsonBody(updateBody(0, "phone" to OTHER_PHONE)) }.andExpectError(CommonErrorCode.INVALID_CSRF_TOKEN)
		assertThat(hotelIds() - existingIds).containsExactly(hotelId)
		assertThat(hotelRepository.findById(hotelId).orElseThrow().phone).isEqualTo(PHONE)
	}

	@Test
	fun `목록 API 문서는 검색어와 page·size의 기본값과 범위, 모든 필드가 필수인 페이지 응답 스키마를 보여준다`() {
		val docs = apiDocs()
		val getHotels = docs["paths"][HOTELS]["get"]
		val parameters = getHotels["parameters"].values().associateBy { it["name"].stringValue() }
		val schemas = docs["components"]["schemas"]

		assertThat(parameters.keys).containsExactly("keyword", "page", "size")
		assertThat(parameters.values.map { it["description"].stringValue() }).allSatisfy { assertThat(it).doesNotStartWith("openapi.") }
		assertThat(parameters.values.map { it["required"].booleanValue() }).containsOnly(false)
		assertThat(parameters.getValue("keyword")["schema"]).isEqualTo(json("""{"type":"string","maxLength":100,"minLength":0}"""))
		assertThat(parameters.getValue("page")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":0,"minimum":0,"maximum":99}"""))
		assertThat(parameters.getValue("size")["schema"])
			.isEqualTo(json("""{"type":"integer","format":"int32","default":10,"minimum":1,"maximum":100}"""))
		assertThat(getHotels["responses"]["200"]["content"][JSON]["schema"]).isEqualTo(schemaRef("ApiResponsePageResponseHotelAppAdminResponse"))
		assertThat(schemas["ApiResponsePageResponseHotelAppAdminResponse"]["properties"]["data"]["oneOf"][0])
			.isEqualTo(schemaRef("PageResponseHotelAppAdminResponse"))
		val page = schemas["PageResponseHotelAppAdminResponse"]
		assertThat(page["required"].values().map { it.stringValue() }).containsExactlyInAnyOrder("items", "page", "size", "totalElements", "totalPages")
		assertThat(page["properties"]["items"]["items"]).isEqualTo(schemaRef("HotelAppAdminResponse"))
	}

	@Test
	fun `호텔 API 문서는 operation마다 낼 수 있는 호텔 에러를 예시로 보여준다`() {
		val paths = apiDocs()["paths"]
		val hotel = paths["$HOTELS/{hotelId}"]

		assertThat(errorCodes(paths[HOTELS]["post"], HttpStatus.CONFLICT))
			.containsExactlyInAnyOrder(HotelErrorCode.HOTEL_DUPLICATED.code, AccountErrorCode.LOGIN_ID_DUPLICATED.code)
		assertThat(paths[HOTELS]["get"]["responses"].propertyNames()).doesNotContain("404", "409")
		assertThat(errorCodes(hotel["get"], HttpStatus.NOT_FOUND)).containsExactly(HotelErrorCode.HOTEL_NOT_FOUND.code)
		assertThat(errorCodes(hotel["put"], HttpStatus.NOT_FOUND)).containsExactly(HotelErrorCode.HOTEL_NOT_FOUND.code)
		assertThat(errorCodes(hotel["put"], HttpStatus.CONFLICT))
			.containsExactlyInAnyOrder(HotelErrorCode.HOTEL_DUPLICATED.code, HotelErrorCode.HOTEL_MODIFIED.code)
	}

	@ParameterizedTest
	@ValueSource(strings = ["HotelCreateAppAdminRequest", "HotelUpdateAppAdminRequest"])
	fun `요청 문서의 필수 문자열은 최소 길이 1과 최대 길이를, 전화번호는 형식도 보여주고 선택 항목인 소개는 최소 길이를 요구하지 않는다`(schema: String) {
		val properties = apiDocs()["components"]["schemas"][schema]["properties"]
		val lengths = listOf("name", "address", "phone", "description").associateWith { field ->
			listOf("minLength", "maxLength").map { properties[field][it]?.intValue() }
		}

		assertThat(lengths).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"name" to listOf(1, Hotel.NAME_MAX_LENGTH),
				"address" to listOf(1, Hotel.ADDRESS_MAX_LENGTH),
				"phone" to listOf(1, Hotel.PHONE_MAX_LENGTH),
				"description" to listOf(0, Hotel.DESCRIPTION_MAX_LENGTH),
			),
		)
		assertThat(properties["phone"]["pattern"].stringValue()).isEqualTo(Hotel.PHONE_PATTERN)
		assertThat(properties["version"]?.get("minLength")).isNull()
	}

	@Test
	fun `등록 요청 문서는 필수인 master 객체에 아이디의 이메일 형식과 길이, 이름 길이, 비밀번호 규칙을 보여주고 수정 요청에는 master가 없다`() {
		val schemas = apiDocs()["components"]["schemas"]
		val create = schemas["HotelCreateAppAdminRequest"]
		val master = schemas["HotelMasterCreateAppAdminRequest"]
		val properties = master["properties"]
		val rules = listOf("loginId", "name", "password").associateWith { field ->
			listOf("minLength", "maxLength", "pattern").map { properties[field][it]?.asString() }
		}

		assertThat(create["properties"]["master"]["\$ref"].stringValue()).isEqualTo("#/components/schemas/HotelMasterCreateAppAdminRequest")
		assertThat(create["required"].values().map { it.stringValue() }).contains("master")
		assertThat(schemas["HotelUpdateAppAdminRequest"]["properties"].propertyNames()).doesNotContain("master")
		assertThat(master["required"].values().map { it.stringValue() }).containsExactlyInAnyOrder("loginId", "name", "password")
		assertThat(rules).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"loginId" to listOf("1", HotelAdmin.LOGIN_ID_MAX_LENGTH.toString(), LoginId.PATTERN),
				"name" to listOf("1", HotelAdmin.NAME_MAX_LENGTH.toString(), null),
				"password" to listOf(Password.MIN_LENGTH.toString(), Password.MAX_LENGTH.toString(), Password.PATTERN),
			),
		)
	}

	private fun create(body: Map<String, Any?>, role: Role = Role.APP_ADMIN): ResultActionsDsl =
		mockMvc.post(HOTELS) {
			loggedIn(role)
			withCsrf()
			jsonBody(body)
		}

	private fun update(hotelId: Long, body: Map<String, Any?>, role: Role = Role.APP_ADMIN): ResultActionsDsl =
		mockMvc.put("$HOTELS/$hotelId") {
			loggedIn(role)
			withCsrf()
			jsonBody(body)
		}

	private fun searchHotels(keyword: String, vararg params: Pair<String, String>): JsonNode =
		mockMvc.get(HOTELS) {
			loggedIn()
			param("keyword", keyword)
			params.forEach { (name, value) -> param(name, value) }
		}.andExpectSuccess(HttpStatus.OK)

	private fun MockHttpServletRequestDsl.loggedIn(role: Role = Role.APP_ADMIN) {
		with(user(USERNAME).roles(role.name))
	}

	private fun MockHttpServletRequestDsl.withCsrf() {
		cookie(xsrf)
		header(XSRF_HEADER, xsrf.value)
	}

	private fun MockHttpServletRequestDsl.jsonBody(body: Map<String, Any?>) {
		contentType = MediaType.APPLICATION_JSON
		content = jsonMapper.writeValueAsString(body)
	}

	private fun hotelFields(): Map<String, Any?> =
		linkedMapOf("name" to name, "address" to address, "phone" to PHONE, "description" to DESCRIPTION)

	private fun createBody(vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		hotelFields() + ("master" to masterBody()) + overrides

	private fun masterBody(vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		linkedMapOf<String, Any?>(
			"loginId" to "master-${masterSequence.incrementAndGet()}-$suffix@test.local",
			"name" to MASTER_NAME,
			"password" to MASTER_PASSWORD,
		) + overrides

	private fun updateBody(version: Long, vararg overrides: Pair<String, Any?>): Map<String, Any?> =
		hotelFields() + ("version" to version) + overrides

	@Suppress("UNCHECKED_CAST")
	private fun masterLoginId(body: Map<String, Any?>): String = (body["master"] as Map<String, Any?>)["loginId"] as String

	private fun masterOf(hotelId: Long): Map<String, Any?> = jdbcTemplate.queryForMap(SELECT_MASTER, hotelId)

	private fun mastersWithLoginId(loginId: String): List<Long> =
		jdbcTemplate.queryForList(SELECT_MASTER_HOTEL_IDS, Long::class.javaObjectType, LoginId.normalize(loginId)).filterNotNull()

	private fun emailOfLength(length: Int): String {
		val prefix = "$suffix@test."
		return prefix + "d".repeat(length - prefix.length)
	}

	private fun saveHotel(name: String = this.name): Hotel = hotelRepository.save(Hotel(name, address, PHONE, DESCRIPTION))

	private fun saveHotels(count: Int): List<Long> = (1..count).map { checkNotNull(saveHotel("목록 $suffix $it").id) }

	private fun hotelsNamed(name: String): List<Hotel> = hotelRepository.findAll().filter { it.name == name }

	private fun hotelIds(): Set<Long> = hotelRepository.findAll().mapNotNull { it.id }.toSet()

	private fun <T> concurrently(request: (Int) -> T): List<T> {
		val start = CountDownLatch(1)
		val futures = (0 until CONCURRENT_REQUESTS).map { index -> executor.submit(Callable { start.await(); request(index) }) }
		start.countDown()
		return futures.map { it.get(TIMEOUT_SECONDS, TimeUnit.SECONDS) }
	}

	private fun ResultActionsDsl.andExpectSuccess(status: HttpStatus): JsonNode {
		val result = andReturn()
		val body = json(result.response)
		assertThat(result.response.status).isEqualTo(status.value())
		assertThat(body.properties().map { it.key }).containsExactly("success", "data", "message", "error")
		assertThat(body["success"].booleanValue()).isTrue()
		assertThat(body["message"].stringValue(null)).isEqualTo(successMessage(result.request))
		assertThat(body["error"].isNull).isTrue()
		return body["data"]
	}

	private fun successMessage(request: MockHttpServletRequest): String? =
		SUCCESS_MESSAGE_KEYS.entries.firstOrNull { it.key.matches("${request.method} ${request.requestURI}") }?.value?.let(::message)

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

	private fun hotelJson(id: Long, name: String, address: String, phone: String, description: String?, version: Long): JsonNode =
		json(
			jsonMapper.writeValueAsString(
				linkedMapOf("id" to id, "name" to name, "address" to address, "phone" to phone, "description" to description, "version" to version),
			),
		)

	private fun hotelJson(hotel: Hotel): JsonNode =
		hotelJson(checkNotNull(hotel.id), hotel.name, hotel.address, hotel.phone, hotel.description, hotel.version)

	private fun itemIds(data: JsonNode): List<Long> = data["items"].values().map { it["id"].longValue() }

	private fun pageInfo(data: JsonNode): List<Long> = listOf("page", "size", "totalElements", "totalPages").map { data[it].longValue() }

	private fun ceilDiv(total: Long, size: Long): Long = (total + size - 1) / size

	private fun apiDocs(): JsonNode =
		json(mockMvc.get(APP_ADMIN_DOCS).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8))

	private fun errorCodes(operation: JsonNode, status: HttpStatus): List<String> {
		val content = operation["responses"][status.value().toString()]["content"][JSON]
		val examples = content["example"]?.let { listOf(it) } ?: content["examples"].values().map { it["value"] }
		return examples.map { it["error"]["code"].stringValue() }
	}

	private fun schemaRef(name: String): JsonNode = json("""{"${'$'}ref":"#/components/schemas/$name"}""")

	private fun json(response: MockHttpServletResponse): JsonNode = json(response.getContentAsString(StandardCharsets.UTF_8))

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private fun maxLength(max: Int): String = message("validation.max-length").replace("{max}", max.toString())

	companion object {
		private const val HOTELS = ApiPaths.APP_ADMIN + "/hotels"
		private const val APP_ADMIN_DOCS = "/v3/api-docs/app-admin"
		private const val PHONE = "02-1234-5678"
		private const val OTHER_PHONE = "02-8765-4321"
		private const val DESCRIPTION = "강남역 근처 호텔"
		private const val USERNAME = "tester"
		private const val XSRF_COOKIE = "XSRF-TOKEN"
		private const val XSRF_HEADER = "X-XSRF-TOKEN"
		private const val FIELD_ERRORS = "fieldErrors"
		private const val JSON = "application/json"
		private const val REQUIRED = "validation.required"
		private const val TYPE = "validation.type"
		private const val PHONE_FORMAT = "validation.phone"
		private const val MAX_LENGTH = "validation.max-length"
		private const val EMAIL = "validation.email"
		private const val PASSWORD = "validation.password"
		private const val MASTER_NAME = "마스터"
		private const val MASTER_PASSWORD = "master-password-1"
		private const val MISSING_ID = Long.MAX_VALUE
		private const val CONCURRENT_REQUESTS = 2
		private const val TIMEOUT_SECONDS = 10L
		private const val LONG_INPUT_TIMEOUT_SECONDS = 3L
		private const val DELETE_HOTEL_ADMINS = "delete from hotel_admin where hotel_id = ?"
		private const val SELECT_MASTER =
			"select login_id, name, role, active, credential_version, password_hash from hotel_admin where hotel_id = ? and role = 'MASTER'"
		private const val SELECT_MASTER_HOTEL_IDS = "select hotel_id from hotel_admin where role = 'MASTER' and login_id = ?"
		private val SUCCESS_MESSAGE_KEYS = mapOf(
			Regex("POST $HOTELS") to "success.hotel.created",
			Regex("PUT $HOTELS/\\d+") to "success.hotel.updated",
		)

		@JvmStatic
		fun phoneErrors(): List<Arguments> = listOf(
			Arguments.of(" 　 ", REQUIRED),
			Arguments.of("abcdefghijklmnopqrstuvwxy", PHONE_FORMAT),
			Arguments.of("02-1234-56789-0-0-0-0-0", PHONE_FORMAT),
			Arguments.of("0-1-2-3-4-5-6-7-8-9-0", MAX_LENGTH),
			Arguments.of("02----1234----5678----", MAX_LENGTH),
		)

		@JvmStatic
		fun typeMismatches(): List<Arguments> = listOf(
			Arguments.of("name", 123),
			Arguments.of("name", true),
			Arguments.of("address", listOf("서울")),
			Arguments.of("phone", 212345678),
			Arguments.of("description", mapOf("text" to "소개")),
			Arguments.of("master", "master@test.local"),
			Arguments.of("master", listOf("master@test.local")),
		)

		@JvmStatic
		fun masterLoginIdErrors(): List<Arguments> {
			val tooLong = "a".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH - "@test.local".length + 1) + "@test.local"
			return listOf(
				Arguments.of("", REQUIRED),
				Arguments.of("   ", REQUIRED),
				Arguments.of("　", REQUIRED),
				Arguments.of("master", EMAIL),
				Arguments.of("master@", EMAIL),
				Arguments.of("@test.local", EMAIL),
				Arguments.of("master@test", EMAIL),
				Arguments.of("master@test.", EMAIL),
				Arguments.of("mas ter@test.local", EMAIL),
				Arguments.of("a b@x.com", EMAIL),
				Arguments.of("a　b@x.com", EMAIL),
				Arguments.of("홍길동@x.com", EMAIL),
				Arguments.of("a@b..com", EMAIL),
				Arguments.of("a@.b.com", EMAIL),
				Arguments.of("a@b.com.", EMAIL),
				Arguments.of("a@b", EMAIL),
				Arguments.of("master@@test.local", EMAIL),
				Arguments.of("a".repeat(HotelAdmin.LOGIN_ID_MAX_LENGTH + 1), EMAIL),
				Arguments.of(tooLong, MAX_LENGTH),
				Arguments.of(" $tooLong ", MAX_LENGTH),
			)
		}
	}
}
