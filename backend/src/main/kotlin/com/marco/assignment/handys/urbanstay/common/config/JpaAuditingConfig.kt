package com.marco.assignment.handys.urbanstay.common.config

import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing
class JpaAuditingConfig
