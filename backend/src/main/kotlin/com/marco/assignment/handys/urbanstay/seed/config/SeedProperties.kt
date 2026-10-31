package com.marco.assignment.handys.urbanstay.seed.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("urbanstay.seed")
class SeedProperties(
	val enabled: Boolean = false,
)
