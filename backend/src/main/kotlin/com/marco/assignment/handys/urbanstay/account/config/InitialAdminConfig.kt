package com.marco.assignment.handys.urbanstay.account.config

import com.marco.assignment.handys.urbanstay.account.service.InitialAdminService
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(InitialAdminProperties::class)
class InitialAdminConfig {

	@Bean
	fun initialAdminRunner(initialAdminService: InitialAdminService, properties: InitialAdminProperties): ApplicationRunner =
		ApplicationRunner { initialAdminService.createIfAbsent(properties) }
}
