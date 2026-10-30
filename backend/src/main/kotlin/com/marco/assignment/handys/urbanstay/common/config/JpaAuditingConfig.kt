package com.marco.assignment.handys.urbanstay.common.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.data.auditing.DateTimeProvider
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import java.time.Clock
import java.util.Optional

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing(dateTimeProviderRef = JpaAuditingConfig.DATE_TIME_PROVIDER)
@Import(ClockConfig::class)
class JpaAuditingConfig {

	@Bean(DATE_TIME_PROVIDER)
	fun auditingDateTimeProvider(clock: Clock): DateTimeProvider = DateTimeProvider { Optional.of(clock.instant()) }

	companion object {
		const val DATE_TIME_PROVIDER = "auditingDateTimeProvider"
	}
}
