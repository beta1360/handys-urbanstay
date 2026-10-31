package com.marco.assignment.handys.urbanstay

import com.marco.assignment.handys.urbanstay.common.config.ClockConfig
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import java.time.Clock
import java.time.Instant
import java.time.LocalDate

@TestConfiguration(proxyBeanMethods = false)
class FixedClockConfiguration {

	@Bean
	@Primary
	fun fixedClock(): Clock = Clock.fixed(NOW, ClockConfig.ZONE)

	companion object {
		val NOW: Instant = Instant.parse("2026-11-01T15:30:00Z")
		val TODAY: LocalDate = LocalDate.ofInstant(NOW, ClockConfig.ZONE)
	}
}
