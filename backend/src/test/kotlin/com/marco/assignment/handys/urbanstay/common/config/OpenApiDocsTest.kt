package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.exception.CommonErrorCode
import com.marco.assignment.handys.urbanstay.common.exception.ErrorCode
import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.nio.charset.StandardCharsets
import java.util.Locale

@SpringBootTest(properties = ["spring.messages.basename=messages,test-messages"])
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration::class, OpenApiDocsTest.SampleController::class)
class OpenApiDocsTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var jsonMapper: JsonMapper

	@Autowired
	private lateinit var messageSource: MessageSource

	@Test
	fun `문서 정보는 설정 파일의 제목과 버전, 메시지 파일의 설명을 쓴다`() {
		val info = apiDocs()["info"]

		assertThat(info["title"].stringValue()).isEqualTo("Urbanstay API")
		assertThat(info["description"].stringValue()).isEqualTo(message(OpenApiConfig.DESCRIPTION_KEY))
		assertThat(info["version"].stringValue()).isEqualTo("v1")
	}

	@Test
	fun `태그는 도메인 이름과 메시지 파일의 설명으로 노출된다`() {
		val docs = apiDocs()

		assertThat(docs["tags"].values().map { it["name"].stringValue() to it["description"].stringValue() })
			.contains("sample" to message("openapi.tag.sample"))
		assertThat(sampleOperations(docs).map { operation -> operation.node["tags"].values().map { it.stringValue() } })
			.isNotEmpty()
			.allSatisfy { assertThat(it).containsExactly("sample") }
	}

	@Test
	fun `설명과 요약에 해석되지 않은 문서 메시지 키가 없다`() {
		val texts = texts(apiDocs(), setOf("description", "summary"))

		assertThat(texts).isNotEmpty().noneMatch { it.startsWith(DOC_KEY_PREFIX) }
	}

	@Test
	fun `모든 응답은 application_json이다`() {
		val contentTypes = operations(apiDocs())
			.flatMap { it.node["responses"].values() }
			.flatMap { it.path("content").propertyNames() }

		assertThat(contentTypes).isNotEmpty().containsOnly(JSON)
	}

	@Test
	fun `모든 operation에 공통 에러 응답이 에러 형식과 예시로 붙는다`() {
		val operations = operations(apiDocs())

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

	@Test
	fun `operation은 성공 응답과 공통 에러 응답만 가진다`() {
		val responses = sampleOperations(apiDocs())
			.associate { it.operationId to it.node["responses"].propertyNames().toSet() }

		assertThat(responses).containsExactlyInAnyOrderEntriesOf(
			mapOf(
				"getSample" to setOf("200", "400", "500"),
				"createSample" to setOf("201", "400", "500"),
			),
		)
	}

	@Test
	fun `에러 형식은 문서 전용 ErrorApiResponse이고 원시 ApiResponse 스키마는 없다`() {
		val schemas = apiDocs()["components"]["schemas"]
		val envelope = schemas[ERROR_SCHEMA_REF.substringAfterLast("/")]

		assertThat(schemas.propertyNames()).doesNotContain("ApiResponse")
		assertThat(required(envelope)).containsExactlyInAnyOrder("success", "data", "error")
		assertThat(envelope["properties"]["data"]).isEqualTo(json("""{"type":"null"}"""))
		assertThat(envelope["properties"]["error"]).isEqualTo(json("""{"$REF":"#/components/schemas/ErrorResponse"}"""))
		assertThat(required(schemas["ErrorResponse"])).containsExactlyInAnyOrder("code", "message", "fieldErrors")
	}

	@Test
	fun `응답 스키마는 모든 필드가 필수이고 nullable 필드는 null을 허용한다`() {
		val wrapper = apiDocs()["components"]["schemas"]["ApiResponseSampleResponse"]

		assertThat(required(wrapper)).containsExactlyInAnyOrder("success", "data", "error")
		assertThat(nullableFields(wrapper)).containsExactlyInAnyOrder("data", "error")
	}

	@Test
	fun `요청 스키마는 non-null 필드만 필수이고 nullable 필드는 선택이다`() {
		val request = apiDocs()["components"]["schemas"]["SampleRequest"]

		assertThat(required(request)).containsExactly("name")
		assertThat(nullableFields(request)).containsExactly("memo")
	}

	@Test
	fun `모든 스키마는 요청·응답 규칙대로 필수 필드를 가진다`() {
		val docs = apiDocs()
		val schemas = docs["components"]["schemas"]
		val operations = operations(docs)
		val responseSchemas = reachable(schemas, operations.map { it.node.path("responses") })
		val requestSchemas = reachable(schemas, operations.flatMap { listOf(it.node.path("requestBody"), it.node.path("parameters")) })
		val conflicts = (responseSchemas intersect requestSchemas).filter { nullableFields(schemas[it]).isNotEmpty() }

		assertThat(conflicts).describedAs("요청과 응답이 함께 쓰는 스키마에 nullable 필드가 있습니다. 요청/응답 DTO를 분리하세요").isEmpty()
		assertThat(responseSchemas).contains("ApiResponseSampleResponse", "ErrorApiResponse", "ErrorResponse", "FieldErrorResponse")
		assertThat(requestSchemas).contains("SampleRequest")
		(responseSchemas + requestSchemas).forEach { name ->
			val properties = schemas[name].path("properties").propertyNames()
			val expected = if (name in requestSchemas) properties - nullableFields(schemas[name]) else properties
			assertThat(required(schemas[name])).describedAs(name).containsExactlyInAnyOrderElementsOf(expected)
		}
	}

	@Test
	fun `operationId는 springdoc 중복 접미사 없이 유일하다`() {
		val operationIds = operations(apiDocs()).map { it.operationId }

		assertThat(operationIds)
			.isNotEmpty()
			.doesNotHaveDuplicates()
			.noneMatch { DUPLICATE_SUFFIX.containsMatchIn(it) }
	}

	private fun apiDocs(): JsonNode =
		json(mockMvc.get("/v3/api-docs").andReturn().response.getContentAsString(StandardCharsets.UTF_8))

	private fun json(content: String): JsonNode = jsonMapper.readTree(content)

	private fun message(key: String): String = messageSource.getMessage(key, null, Locale.KOREAN)

	private fun operations(docs: JsonNode): List<DocOperation> =
		docs["paths"].properties().flatMap { (path, item) ->
			HTTP_METHODS.mapNotNull { method -> item[method]?.let { DocOperation(path, method, it) } }
		}

	private fun sampleOperations(docs: JsonNode): List<DocOperation> =
		operations(docs).filter { it.path.startsWith(SAMPLE_PATH) }

	private fun expectedExample(errorCode: ErrorCode): JsonNode =
		json("""{"success":false,"data":null,"error":{"code":"${errorCode.code}","message":"${message(errorCode.messageKey)}","fieldErrors":[]}}""")

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

	data class SampleRequest(
		@NotBlank
		@Schema(description = "openapi.schema.SampleRequest.name")
		val name: String,
		@Schema(description = "openapi.schema.SampleRequest.memo")
		val memo: String?,
	)

	data class SampleResponse(
		@Schema(description = "openapi.schema.SampleResponse.id")
		val id: Long,
		@Schema(description = "openapi.schema.SampleResponse.name")
		val name: String,
		@Schema(description = "openapi.schema.SampleResponse.memo")
		val memo: String?,
	)

	@Tag(name = "sample", description = "openapi.tag.sample")
	@RestController
	@RequestMapping(SAMPLE_PATH)
	class SampleController {

		@Operation(summary = "openapi.operation.getSample.summary")
		@GetMapping("/{id}")
		fun getSample(@PathVariable id: Long): ApiResponse<SampleResponse> =
			ApiResponse.success(SampleResponse(id, "sample", null))

		@Operation(summary = "openapi.operation.createSample.summary")
		@PostMapping
		@ResponseStatus(HttpStatus.CREATED)
		fun createSample(@Valid @RequestBody request: SampleRequest): ApiResponse<SampleResponse> =
			ApiResponse.success(SampleResponse(1, request.name, request.memo))
	}

	companion object {
		private const val SAMPLE_PATH = "/api/v1/samples"
		private const val ERROR_SCHEMA_REF = "#/components/schemas/ErrorApiResponse"
		private const val DOC_KEY_PREFIX = "openapi."
		private const val JSON = "application/json"
		private const val REF = "\$ref"
		private const val NULL_TYPE = "null"
		private val COMMON_ERRORS = listOf(CommonErrorCode.INVALID_INPUT, CommonErrorCode.INTERNAL_SERVER_ERROR)
		private val HTTP_METHODS = HttpMethod.values().map { it.name().lowercase() }
		private val DUPLICATE_SUFFIX = Regex("_\\d+$")
	}
}
