package com.marco.assignment.handys.urbanstay.common.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Clock
import java.time.ZoneId

@Configuration(proxyBeanMethods = false)
class ClockConfig {

	@Bean
	fun clock(): Clock = Clock.system(ZONE)

	companion object {
		val ZONE: ZoneId = ZoneId.of("Asia/Seoul")
	}
}
