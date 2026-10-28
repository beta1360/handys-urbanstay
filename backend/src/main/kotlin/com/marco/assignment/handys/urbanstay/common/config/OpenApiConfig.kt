package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springdoc.core.models.GroupedOpenApi
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.MessageSource
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.i18n.LocaleContextHolder

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(OpenApiProperties::class)
class OpenApiConfig {

	@Bean
	fun openApi(properties: OpenApiProperties, messageSource: MessageSource): OpenAPI =
		OpenAPI().info(
			Info()
				.title(properties.title)
				.description(messageSource.getMessage(DESCRIPTION_KEY, null, LocaleContextHolder.getLocale()))
				.version(properties.version),
		)

	@Bean
	fun appGroup(messageSource: MessageSource): GroupedOpenApi = group(APP_GROUP, ApiPaths.APP, messageSource)

	@Bean
	fun opsGroup(messageSource: MessageSource): GroupedOpenApi = group(OPS_GROUP, ApiPaths.OPS, messageSource)

	private fun group(name: String, path: String, messageSource: MessageSource): GroupedOpenApi =
		GroupedOpenApi.builder()
			.group(name)
			.displayName(messageSource.getMessage("$GROUP_KEY_PREFIX$name", null, LocaleContextHolder.getLocale()))
			.pathsToMatch("$path/**")
			.build()

	companion object {
		const val DESCRIPTION_KEY = "openapi.info.description"
		private const val GROUP_KEY_PREFIX = "openapi.group."
		private const val APP_GROUP = "app"
		private const val OPS_GROUP = "ops"
	}
}
