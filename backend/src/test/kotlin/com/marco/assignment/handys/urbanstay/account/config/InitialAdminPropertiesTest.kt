package com.marco.assignment.handys.urbanstay.account.config

import com.marco.assignment.handys.urbanstay.account.entity.AppAdmin
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.context.properties.bind.validation.BindValidationException
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import org.springframework.validation.FieldError

class InitialAdminPropertiesTest {

	private val contextRunner = ApplicationContextRunner()
		.withUserConfiguration(PropertiesConfig::class.java)
		.withPropertyValues("$PREFIX.login-id=$MAX_LENGTH_LOGIN_ID", "$PREFIX.password=password", "$PREFIX.name=$MAX_LENGTH_NAME")

	@Test
	fun `최대 길이까지의 올바른 설정값을 바인딩한다`() {
		contextRunner.run { context ->
			assertThat(context).hasNotFailed()
			val properties = context.getBean(InitialAdminProperties::class.java)
			assertThat(properties.loginId).isEqualTo(MAX_LENGTH_LOGIN_ID)
			assertThat(properties.password).isEqualTo("password")
			assertThat(properties.name).isEqualTo(MAX_LENGTH_NAME)
		}
	}

	@ParameterizedTest
	@MethodSource("invalidValues")
	fun `설정값이 올바르지 않으면 컨텍스트 시작에 실패한다`(property: String, value: String, field: String) {
		contextRunner.withPropertyValues("$PREFIX.$property=$value").run { context ->
			assertThat(context).hasFailed()
			assertThat(context.startupFailure).rootCause().isInstanceOfSatisfying(BindValidationException::class.java) {
				assertThat(it.validationErrors.allErrors.map { error -> (error as FieldError).field }).containsExactly(field)
			}
		}
	}

	@EnableConfigurationProperties(InitialAdminProperties::class)
	class PropertiesConfig

	companion object {
		private const val PREFIX = "urbanstay.initial-admin"
		private val EMAIL_PREFIX = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "."
		private val MAX_LENGTH_LOGIN_ID = emailOfLength(AppAdmin.LOGIN_ID_MAX_LENGTH)
		private val MAX_LENGTH_NAME = "a".repeat(AppAdmin.NAME_MAX_LENGTH)

		private fun emailOfLength(length: Int): String = EMAIL_PREFIX + "d".repeat(length - EMAIL_PREFIX.length)

		@JvmStatic
		fun invalidValues(): List<Arguments> = listOf(
			Arguments.of("login-id", "not-an-email", "loginId"),
			Arguments.of("login-id", "", "loginId"),
			Arguments.of("login-id", emailOfLength(AppAdmin.LOGIN_ID_MAX_LENGTH + 1), "loginId"),
			Arguments.of("password", "", "password"),
			Arguments.of("name", "", "name"),
			Arguments.of("name", MAX_LENGTH_NAME + "a", "name"),
		)
	}
}
