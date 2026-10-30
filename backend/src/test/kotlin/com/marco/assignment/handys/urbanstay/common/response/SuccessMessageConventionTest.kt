package com.marco.assignment.handys.urbanstay.common.response

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.UrbanstayApplication
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Import
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.servlet.mvc.method.RequestMappingInfoHandlerMapping
import java.util.Locale

@SpringBootTest
@Import(TestcontainersConfiguration::class)
class SuccessMessageConventionTest {

	@Autowired
	private lateinit var handlerMappings: List<RequestMappingInfoHandlerMapping>

	@Autowired
	private lateinit var messageSource: MessageSource

	@Test
	fun `상태를 바꾸는 핸들러에는 모두 messages_properties에 있는 키로 SuccessMessage가 있고 GET 핸들러에는 없다`() {
		val successMessageKeys = handlerMappings.flatMap { it.handlerMethods.entries }
			.filter { (_, handler) -> handler.beanType.packageName.startsWith(BASE_PACKAGE) }
			.associate { (mapping, handler) -> mapping to handler.getMethodAnnotation(SuccessMessage::class.java)?.key }
		val changes = successMessageKeys.filterKeys { mapping -> mapping.methodsCondition.methods.any(CHANGE_METHODS::contains) }
		val queries = successMessageKeys.filterKeys { mapping -> RequestMethod.GET in mapping.methodsCondition.methods }

		assertThat(changes).isNotEmpty()
		assertThat(queries).isNotEmpty()
		assertThat(changes.filterValues { it == null }.keys).describedAs("@SuccessMessage가 없는 상태 변경 핸들러").isEmpty()
		assertThat(changes.values.filterNotNull().filter { messageSource.getMessage(it, null, null, Locale.KOREAN) == null })
			.describedAs("messages.properties에 없는 성공 문구 키")
			.isEmpty()
		assertThat(queries.filterValues { it != null }.keys).describedAs("@SuccessMessage가 붙은 GET 핸들러").isEmpty()
	}

	companion object {
		private val BASE_PACKAGE = UrbanstayApplication::class.java.packageName
		private val CHANGE_METHODS = setOf(RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE)
	}
}
