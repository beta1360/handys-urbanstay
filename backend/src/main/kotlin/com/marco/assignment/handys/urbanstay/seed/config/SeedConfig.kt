package com.marco.assignment.handys.urbanstay.seed.config

import com.marco.assignment.handys.urbanstay.seed.service.SeedService
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(SeedProperties::class)
class SeedConfig {

	@Bean
	fun seedRunner(seedService: SeedService, properties: SeedProperties): ApplicationRunner =
		ApplicationRunner {
			if (properties.enabled) {
				seedService.seedIfEmpty()
			}
		}
}
