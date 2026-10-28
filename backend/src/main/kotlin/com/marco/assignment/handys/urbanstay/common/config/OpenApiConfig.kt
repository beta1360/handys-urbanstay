package com.marco.assignment.handys.urbanstay.common.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
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

	companion object {
		const val DESCRIPTION_KEY = "openapi.info.description"
	}
}
