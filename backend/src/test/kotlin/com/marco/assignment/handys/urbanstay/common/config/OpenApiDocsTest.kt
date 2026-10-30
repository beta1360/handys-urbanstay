package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.UrbanstayApplication
import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.tags.Tag
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.PathItem
import io.swagger.v3.oas.models.responses.ApiResponses
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.method.HandlerMethod
import org.springframework.web.servlet.mvc.method.RequestMappingInfoHandlerMapping
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.nio.charset.StandardCharsets
import java.util.Locale
import io.swagger.v3.oas.models.Operation as OperationModel

@SpringBootTest(properties = ["spring.messages.basename=messages,test-messages"])
@AutoConfigureMockMvc
@Import(
	TestcontainersConfiguration::class,
	OpenApiDocsTest.SampleAppController::class,
	OpenApiDocsTest.SampleAppAdminController::class,
	OpenApiDocsTest.SampleHotelAdminController::class,
)
class OpenApiDocsTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var messageSource: MessageSource

	@Autowired
	private lateinit var handlerMappings: List<RequestMappingInfoHandlerMapping>

	@Autowired
	private lateinit var commonErrorResponseCustomizer: CommonErrorResponseCustomizer

	@Test
	fun `앱의 모든 API는 app, app-admin, hotel-admin 경로 아래에 있다`() {
		val handlers = handlerMappings.flatMap { it.handlerMethods.entries }
			.filter { (_, handler) -> handler.beanType.packageName.startsWith(BASE_PACKAGE) }
		val outside = handlers.flatMap { (mapping, _) -> mapping.patternValues }
			.filterNot { path -> DocGroup.entries.any { path.startsWith("${it.prefix}/") } }

		assertThat(handlers.map { it.value.beanType })
			.contains(SampleAppController::class.java, SampleAppAdminController::class.java, SampleHotelAdminController::class.java)
		assertThat(outside).isEmpty()
	}

	@Test
	fun `그룹 없는 통합 문서는 제공하지 않는다`() {
		mockMvc.get("/v3/api-docs").andExpect { status { isNotFound() } }
	}

	@Test
	fun `Swagger UI는 세 그룹 문서를 메시지 파일의 이름으로 보여준다`() {
		val urls = json(content("/v3/api-docs/swagger-config"))["urls"]

		assertThat(urls.values().map { it["url"].stringValue() to it["name"].stringValue() })
			.containsExactlyInAnyOrderElementsOf(DocGroup.entries.map { it.docsPath to message("openapi.group.${it.id}") })
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `그룹 문서에는 그 그룹 경로의 API만 있다`(group: DocGroup) {
		val paths = apiDocs(group)["paths"].propertyNames()

		assertThat(paths).isNotEmpty().allSatisfy { assertThat(it).startsWith("${group.prefix}/") }
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `그룹 문서에는 다른 그룹의 API가 섞이지 않는다`(group: DocGroup) {
		val paths = apiDocs(group)["paths"].propertyNames()
		val otherPaths = (DocGroup.entries - group).flatMap { apiDocs(it)["paths"].propertyNames() }

		assertThat(otherPaths).isNotEmpty()
		assertThat(paths).isNotEmpty().doesNotContainAnyElementsOf(otherPaths)
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `문서 정보는 설정 파일의 제목과 버전, 메시지 파일의 설명을 쓴다`(group: DocGroup) {
		val info = apiDocs(group)["info"]

		assertThat(info["title"].stringValue()).isEqualTo("Urbanstay API")
		assertThat(info["description"].stringValue()).isEqualTo(message(OpenApiConfig.DESCRIPTION_KEY))
		assertThat(info["version"].stringValue()).isEqualTo("v1")
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `태그와 operation 요약은 그룹별 메시지 키의 문구로 노출된다`(group: DocGroup) {
		val docs = apiDocs(group)
		val operations = sampleOperations(docs, group)

		assertThat(tagDescriptions(docs)).containsEntry("sample", message("openapi.${group.id}.tag.sample"))
		assertThat(operations.map { operation -> operation.node["tags"].values().map { it.stringValue() } })
			.isNotEmpty()
			.allSatisfy { assertThat(it).containsExactly("sample") }
		assertThat(operations.associate { it.operationId to it.node["summary"].stringValue() })
			.containsExactlyInAnyOrderEntriesOf(group.responses.keys.associateWith { message("openapi.${group.id}.operation.$it.summary") })
	}

	@Test
	fun `같은 태그와 operationId라도 그룹마다 다른 문구로 노출된다`() {
		val docs = DocGroup.entries.associateWith { apiDocs(it) }

		assertThat(docs.map { (_, doc) -> tagDescriptions(doc)["sample"] }).doesNotHaveDuplicates()
		assertThat(docs.map { (group, doc) -> sampleOperations(doc, group).single { it.operationId == "getSample" }.node["summary"] })
			.doesNotHaveDuplicates()
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `설명과 요약에 해석되지 않은 문서 메시지 키가 없다`(group: DocGroup) {
		val texts = texts(apiDocs(group), setOf("description", "summary"))

		assertThat(texts).isNotEmpty().noneMatch { it.startsWith(DOC_KEY_PREFIX) }
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `모든 응답은 application_json이다`(group: DocGroup) {
		val contentTypes = operations(apiDocs(group))
			.flatMap { it.node["responses"].values() }
			.flatMap { it.path("content").propertyNames() }

		assertThat(contentTypes).isNotEmpty().containsOnly(JSON)
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `모든 operation에 공통 에러 응답이 에러 형식과 예시로 붙는다`(group: DocGroup) {
		val operations = operations(apiDocs(group))

		assertThat(operations).isNotEmpty()
		operations.forEach { operation ->
			COMMON_ERRORS.forEach { errorCode ->
				val description = "${operation.name} ${errorCode.code}"
				val mediaType = operation.node.path("responses").path(errorCode.status.value().toString()).path("content").path(JSON)
				assertThat(mediaType["schema"]).describedAs(description).isEqualTo(json("""{"$REF":"$ERROR_SCHEMA_REF"}"""))
				assertThat(mediaType["example"]).describedAs(description).isEqualTo(expectedExample(errorCode))
			}
		}
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class, names = ["APP_ADMIN", "HOTEL_ADMIN"])
	fun `열린 API를 뺀 어드민 그룹의 모든 operation에 401·403 에러 응답이 붙고 상태를 바꾸는 operation의 403에는 CSRF 예시도 붙는다`(group: DocGroup) {
		val operations = operations(apiDocs(group)).filterNot { SecurityConfig.isPublicAdminApi(it.method.uppercase(), it.path) }

		assertThat(operations.map { it.method }).contains("get", "delete")
		operations.forEach { operation ->
			val unauthorized = errorMediaType(operation, HttpStatus.UNAUTHORIZED)
			val forbidden = errorMediaType(operation, HttpStatus.FORBIDDEN)
			assertThat(listOf(unauthorized["schema"], forbidden["schema"])).describedAs(operation.name)
				.containsOnly(json("""{"$REF":"$ERROR_SCHEMA_REF"}"""))
			assertThat(unauthorized["example"]).describedAs(operation.name).isEqualTo(expectedExample(CommonErrorCode.UNAUTHORIZED))
			if (operation.method in CSRF_PROTECTED_METHODS) {
				assertThat(forbidden["examples"]).describedAs(operation.name)
					.isEqualTo(expectedExamples(CommonErrorCode.FORBIDDEN, CommonErrorCode.INVALID_CSRF_TOKEN))
			} else {
				assertThat(forbidden["example"]).describedAs(operation.name).isEqualTo(expectedExample(CommonErrorCode.FORBIDDEN))
			}
		}
	}

	@Test
	fun `로그인처럼 열린 어드민 operation은 401·403 자동 에러 대신 선언한 에러와 CSRF 에러만 가진다`() {
		val login = operations(apiDocs(DocGroup.APP_ADMIN)).single { it.name == "post $APP_ADMIN_LOGIN" }

		assertThat(SecurityConfig.PUBLIC_ADMIN_APIS.map { "${it.method.name().lowercase()} ${it.path}" }).contains(login.name)
		assertThat(login.node["responses"].propertyNames()).containsExactlyInAnyOrder("200", "400", "401", "403", "500")
		assertThat(errorMediaType(login, HttpStatus.BAD_REQUEST)["example"]).isEqualTo(expectedExample(CommonErrorCode.INVALID_INPUT))
		assertThat(errorMediaType(login, HttpStatus.UNAUTHORIZED)["example"]).isEqualTo(expectedExample(AccountErrorCode.INVALID_CREDENTIALS))
		assertThat(errorMediaType(login, HttpStatus.FORBIDDEN)["example"]).isEqualTo(expectedExample(CommonErrorCode.INVALID_CSRF_TOKEN))
	}

	@Test
	fun `로그인이 필요한 내 정보 조회와 로그아웃은 자동 401·403 에러 응답을 유지한다`() {
		val operations = operations(apiDocs(DocGroup.APP_ADMIN)).associateBy { it.operationId }
		val getMe = operations.getValue("getMe")
		val logout = operations.getValue("logout")

		assertThat(listOf(getMe, logout).map { errorMediaType(it, HttpStatus.UNAUTHORIZED)["example"] })
			.containsOnly(expectedExample(CommonErrorCode.UNAUTHORIZED))
		assertThat(errorMediaType(getMe, HttpStatus.FORBIDDEN)["example"]).isEqualTo(expectedExample(CommonErrorCode.FORBIDDEN))
		assertThat(errorMediaType(logout, HttpStatus.FORBIDDEN)["examples"])
			.isEqualTo(expectedExamples(CommonErrorCode.FORBIDDEN, CommonErrorCode.INVALID_CSRF_TOKEN))
	}

	@Test
	fun `도메인 에러 어노테이션의 에러는 같은 상태 코드의 자동 에러와 함께 예시로 붙고 임시 필드는 남지 않는다`() {
		val operation = OperationModel().responses(ApiResponses())
		val openApi = OpenAPI().path(ApiPaths.APP + SAMPLES, PathItem().post(operation))

		commonErrorResponseCustomizer.customize(operation, sampleErrorHandler("declaredErrors"))
		commonErrorResponseCustomizer.customise(openApi)

		assertThat(operation.responses["400"]?.content?.get(JSON)?.examples?.keys)
			.containsExactly(CommonErrorCode.INVALID_INPUT.code, SampleErrorCode.SAMPLE_INVALID.code)
		assertThat(operation.extensions).isNull()
	}

	@Test
	fun `ErrorCode enum 배열인 value가 없는 도메인 에러 어노테이션은 문서 생성을 실패시킨다`() {
		assertThatThrownBy { commonErrorResponseCustomizer.customize(OperationModel(), sampleErrorHandler("invalidDeclaration")) }
			.isInstanceOf(IllegalArgumentException::class.java)
			.hasMessageContaining(InvalidApiErrors::class.java.simpleName)
	}

	@Test
	fun `data가 없는 응답은 data가 null인 EmptyApiResponse로 문서화한다`() {
		val docs = apiDocs(DocGroup.APP_ADMIN)
		val logout = operations(docs).single { it.operationId == "logout" }
		val schema = docs["components"]["schemas"]["EmptyApiResponse"]

		assertThat(logout.node["responses"]["200"]["content"][JSON]["schema"]).isEqualTo(json("""{"$REF":"#/components/schemas/EmptyApiResponse"}"""))
		assertThat(required(schema)).containsExactlyInAnyOrder("success", "data", "message", "error")
		assertThat(schema["properties"]["data"]).isEqualTo(json("""{"type":"null"}"""))
		assertThat(nullableFields(schema)).containsExactlyInAnyOrder("data", "message", "error")
	}

	@Test
	fun `게스트 그룹 operation에는 401·403 에러 응답이 붙지 않는다`() {
		val statuses = operations(apiDocs(DocGroup.APP)).flatMap { it.node["responses"].propertyNames() }

		assertThat(statuses).isNotEmpty().doesNotContain("401", "403")
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `operation은 성공 응답과 공통 에러 응답만 가진다`(group: DocGroup) {
		val responses = sampleOperations(apiDocs(group), group)
			.associate { it.operationId to it.node["responses"].propertyNames().toSet() }

		assertThat(responses).containsExactlyInAnyOrderEntriesOf(group.responses)
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `에러 형식은 문서 전용 ErrorApiResponse이고 원시 ApiResponse 스키마는 없다`(group: DocGroup) {
		val schemas = apiDocs(group)["components"]["schemas"]
		val envelope = schemas[ERROR_SCHEMA_REF.substringAfterLast("/")]

		assertThat(schemas.propertyNames()).doesNotContain("ApiResponse")
		assertThat(required(envelope)).containsExactlyInAnyOrder("success", "data", "message", "error")
		assertThat(envelope["properties"]["data"]).isEqualTo(json("""{"type":"null"}"""))
		assertThat(envelope["properties"]["message"]).isEqualTo(json("""{"type":"null"}"""))
		assertThat(envelope["properties"]["error"]).isEqualTo(json("""{"$REF":"#/components/schemas/ErrorResponse"}"""))
		assertThat(required(schemas["ErrorResponse"])).containsExactlyInAnyOrder("code", "message", "fieldErrors")
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `응답 스키마는 모든 필드가 필수이고 nullable 필드는 null을 허용한다`(group: DocGroup) {
		val schemas = apiDocs(group)["components"]["schemas"]
		val wrapper = schemas["ApiResponse${group.responseSchema}"]

		assertThat(required(wrapper)).containsExactlyInAnyOrder("success", "data", "message", "error")
		assertThat(nullableFields(wrapper)).containsExactlyInAnyOrder("data", "message", "error")
		assertThat(nullableFields(schemas[group.responseSchema])).containsExactly("memo")
	}

	@Test
	fun `요청 스키마는 non-null 필드만 필수이고 nullable 필드는 선택이다`() {
		val request = apiDocs(DocGroup.APP)["components"]["schemas"]["SampleAppRequest"]

		assertThat(required(request)).containsExactly("name")
		assertThat(nullableFields(request)).containsExactly("memo")
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `모든 스키마는 요청·응답 규칙대로 필수 필드를 가진다`(group: DocGroup) {
		val docs = apiDocs(group)
		val schemas = docs["components"]["schemas"]
		val operations = operations(docs)
		val responseSchemas = reachable(schemas, operations.map { it.node.path("responses") })
		val requestSchemas = reachable(schemas, operations.flatMap { listOf(it.node.path("requestBody"), it.node.path("parameters")) })
		val conflicts = (responseSchemas intersect requestSchemas).filter { nullableFields(schemas[it]).isNotEmpty() }

		assertThat(conflicts).describedAs("요청과 응답이 함께 쓰는 스키마에 nullable 필드가 있습니다. 요청/응답 DTO를 분리하세요").isEmpty()
		assertThat(responseSchemas).contains("ApiResponse${group.responseSchema}", "ErrorApiResponse", "ErrorResponse", "FieldErrorResponse")
		assertThat(requestSchemas).containsAll(group.requestSchemas)
		(responseSchemas + requestSchemas).forEach { name ->
			val properties = schemas[name].path("properties").propertyNames()
			val expected = if (name in requestSchemas) properties - nullableFields(schemas[name]) else properties
			assertThat(required(schemas[name])).describedAs(name).containsExactlyInAnyOrderElementsOf(expected)
		}
	}

	@ParameterizedTest
	@EnumSource(DocGroup::class)
	fun `operationId는 그룹 안에서 springdoc 중복 접미사 없이 유일하다`(group: DocGroup) {
		val operationIds = operations(apiDocs(group)).map { it.operationId }

		assertThat(operationIds)
			.contains("getSample")
			.doesNotHaveDuplicates()
			.noneMatch { DUPLICATE_SUFFIX.containsMatchIn(it) }
	}

	private fun sampleErrorHandler(name: String): HandlerMethod =
		HandlerMethod(SampleErrorHandlers(), SampleErrorHandlers::class.java.getMethod(name))

	private fun apiDocs(group: DocGroup): JsonNode = json(content(group.docsPath))

	private fun content(path: String): String =
		mockMvc.get(path).andExpect { status { isOk() } }.andReturn().response.getContentAsString(StandardCharsets.UTF_8)

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private fun operations(docs: JsonNode): List<DocOperation> =
		docs["paths"].properties().flatMap { (path, item) ->
			HTTP_METHODS.mapNotNull { method -> item[method]?.let { DocOperation(path, method, it) } }
		}

	private fun sampleOperations(docs: JsonNode, group: DocGroup): List<DocOperation> =
		operations(docs).filter { it.path.startsWith(group.prefix + SAMPLES) }

	private fun tagDescriptions(docs: JsonNode): Map<String, String> =
		docs["tags"].values().associate { it["name"].stringValue() to it["description"].stringValue() }

	private fun expectedExample(errorCode: ErrorCode): JsonNode =
		json("""{"success":false,"data":null,"message":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode.messageKey)}","fieldErrors":[]}}""")

	private fun expectedExamples(vararg errorCodes: ErrorCode): JsonNode =
		json(errorCodes.joinToString(",", "{", "}") { """"${it.code}":{"value":${expectedExample(it)}}""" })

	private fun errorMediaType(operation: DocOperation, status: HttpStatus): JsonNode =
		operation.node.path("responses").path(status.value().toString()).path("content").path(JSON)

	private fun required(schema: JsonNode): List<String> = schema.path("required").values().map { it.stringValue() }

	private fun nullableFields(schema: JsonNode): List<String> =
		schema.path("properties").properties()
			.filter { (_, property) -> (listOf(property) + property.path("oneOf").values()).any { NULL_TYPE in types(it) } }
			.map { it.key }

	private fun types(schema: JsonNode): List<String> =
		schema.path("type").let { type -> if (type.isArray) type.values().map { it.stringValue() } else listOfNotNull(type.stringValue(null)) }

	private fun reachable(schemas: JsonNode, roots: List<JsonNode>): Set<String> {
		val found = mutableSetOf<String>()
		var refs = roots.flatMap { it.findValuesAsString(REF) }
		while (refs.isNotEmpty()) {
			refs = refs.map { it.substringAfterLast("/") }.filter(found::add).flatMap { schemas[it].findValuesAsString(REF) }
		}
		return found
	}

	private fun texts(node: JsonNode, keys: Set<String>): List<String> = when {
		node.isObject -> node.properties().flatMap { (key, value) ->
			listOfNotNull(value.stringValue(null)?.takeIf { key in keys }) + texts(value, keys)
		}
		node.isArray -> node.values().flatMap { texts(it, keys) }
		else -> emptyList()
	}

	private data class DocOperation(val path: String, val method: String, val node: JsonNode) {
		val name: String get() = "$method $path"
		val operationId: String get() = node["operationId"].stringValue()
	}

	enum class DocGroup(
		val id: String,
		val prefix: String,
		val responseSchema: String,
		val responses: Map<String, Set<String>>,
		val requestSchemas: Set<String>,
	) {
		APP(
			"app",
			ApiPaths.APP,
			"SampleAppResponse",
			mapOf("getSample" to setOf("200", "400", "500"), "createSample" to setOf("201", "400", "500")),
			setOf("SampleAppRequest"),
		),
		APP_ADMIN(
			"app-admin",
			ApiPaths.APP_ADMIN,
			"SampleAppAdminResponse",
			mapOf("getSample" to setOf("200", "400", "401", "403", "500"), "deleteSample" to setOf("200", "400", "401", "403", "500")),
			emptySet(),
		),
		HOTEL_ADMIN(
			"hotel-admin",
			ApiPaths.HOTEL_ADMIN,
			"SampleHotelAdminResponse",
			mapOf("getSample" to setOf("200", "400", "401", "403", "500"), "deleteSample" to setOf("200", "400", "401", "403", "500")),
			emptySet(),
		),
		;

		val docsPath: String get() = "/v3/api-docs/$id"
	}

	data class SampleAppRequest(
		@NotBlank
		@Schema(description = "openapi.schema.SampleAppRequest.name")
		val name: String,
		@Schema(description = "openapi.schema.SampleAppRequest.memo")
		val memo: String?,
	)

	data class SampleAppResponse(
		@Schema(description = "openapi.schema.SampleAppResponse.id")
		val id: Long,
		@Schema(description = "openapi.schema.SampleAppResponse.name")
		val name: String,
		@Schema(description = "openapi.schema.SampleAppResponse.memo")
		val memo: String?,
	)

	data class SampleAppAdminResponse(
		@Schema(description = "openapi.schema.SampleAppAdminResponse.id")
		val id: Long,
		@Schema(description = "openapi.schema.SampleAppAdminResponse.memo")
		val memo: String?,
	)

	data class SampleHotelAdminResponse(
		@Schema(description = "openapi.schema.SampleHotelAdminResponse.id")
		val id: Long,
		@Schema(description = "openapi.schema.SampleHotelAdminResponse.memo")
		val memo: String?,
	)

	enum class SampleErrorCode(override val status: HttpStatus) : ErrorCode {
		SAMPLE_INVALID(HttpStatus.BAD_REQUEST),
	}

	@ApiErrors
	@Target(AnnotationTarget.FUNCTION)
	@Retention(AnnotationRetention.RUNTIME)
	annotation class SampleApiErrors(vararg val value: SampleErrorCode)

	@ApiErrors
	@Target(AnnotationTarget.FUNCTION)
	@Retention(AnnotationRetention.RUNTIME)
	annotation class InvalidApiErrors(val value: String)

	class SampleErrorHandlers {

		@SampleApiErrors(SampleErrorCode.SAMPLE_INVALID)
		fun declaredErrors() = Unit

		@InvalidApiErrors("SAMPLE_INVALID")
		fun invalidDeclaration() = Unit
	}

	@Tag(name = "sample", description = "openapi.app.tag.sample")
	@RestController
	@RequestMapping(ApiPaths.APP + SAMPLES)
	class SampleAppController {

		@Operation(summary = "openapi.app.operation.getSample.summary")
		@GetMapping("/{id}")
		fun getSample(@PathVariable id: Long): ApiResponse<SampleAppResponse> =
			ApiResponse.success(SampleAppResponse(id, "sample", null))

		@Operation(summary = "openapi.app.operation.createSample.summary")
		@PostMapping
		@ResponseStatus(HttpStatus.CREATED)
		fun createSample(@Valid @RequestBody request: SampleAppRequest): ApiResponse<SampleAppResponse> =
			ApiResponse.success(SampleAppResponse(1, request.name, request.memo))
	}

	@Tag(name = "sample", description = "openapi.app-admin.tag.sample")
	@RestController
	@RequestMapping(ApiPaths.APP_ADMIN + SAMPLES)
	class SampleAppAdminController {

		@Operation(summary = "openapi.app-admin.operation.getSample.summary")
		@GetMapping("/{id}")
		fun getSample(@PathVariable id: Long): ApiResponse<SampleAppAdminResponse> =
			ApiResponse.success(SampleAppAdminResponse(id, null))

		@Operation(summary = "openapi.app-admin.operation.deleteSample.summary")
		@DeleteMapping("/{id}")
		fun deleteSample(@PathVariable id: Long): ApiResponse<SampleAppAdminResponse> =
			ApiResponse.success(SampleAppAdminResponse(id, null))
	}

	@Tag(name = "sample", description = "openapi.hotel-admin.tag.sample")
	@RestController
	@RequestMapping(ApiPaths.HOTEL_ADMIN + SAMPLES)
	class SampleHotelAdminController {

		@Operation(summary = "openapi.hotel-admin.operation.getSample.summary")
		@GetMapping("/{id}")
		fun getSample(@PathVariable id: Long): ApiResponse<SampleHotelAdminResponse> =
			ApiResponse.success(SampleHotelAdminResponse(id, null))

		@Operation(summary = "openapi.hotel-admin.operation.deleteSample.summary")
		@DeleteMapping("/{id}")
		fun deleteSample(@PathVariable id: Long): ApiResponse<SampleHotelAdminResponse> =
			ApiResponse.success(SampleHotelAdminResponse(id, null))
	}

	companion object {
		private const val SAMPLES = "/samples"
		private const val APP_ADMIN_LOGIN = ApiPaths.APP_ADMIN + ApiPaths.AUTH + ApiPaths.LOGIN
		private const val ERROR_SCHEMA_REF = "#/components/schemas/ErrorApiResponse"
		private const val DOC_KEY_PREFIX = "openapi."
		private const val JSON = "application/json"
		private const val REF = "\$ref"
		private const val NULL_TYPE = "null"
		private val BASE_PACKAGE = UrbanstayApplication::class.java.packageName
		private val COMMON_ERRORS = listOf(CommonErrorCode.INVALID_INPUT, CommonErrorCode.INTERNAL_SERVER_ERROR)
		private val HTTP_METHODS = HttpMethod.values().map { it.name().lowercase() }
		private val CSRF_PROTECTED_METHODS = setOf("post", "put", "patch", "delete")
		private val DUPLICATE_SUFFIX = Regex("_\\d+$")
	}
}
