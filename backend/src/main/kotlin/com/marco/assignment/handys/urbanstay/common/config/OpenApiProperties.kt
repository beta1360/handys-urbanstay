package com.marco.assignment.handys.urbanstay.common.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("urbanstay.openapi")
data class OpenApiProperties(
	val title: String,
	val version: String,
)
