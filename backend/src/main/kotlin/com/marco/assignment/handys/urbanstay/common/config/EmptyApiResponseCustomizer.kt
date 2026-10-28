package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.common.response.ApiResponse
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.media.Schema
import org.springdoc.core.customizers.GlobalOpenApiCustomizer
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class EmptyApiResponseCustomizer : GlobalOpenApiCustomizer {

	override fun customise(openApi: OpenAPI) {
		val schemas = openApi.components?.schemas ?: return
		val rawSchema = schemas.remove(RAW_SCHEMA_NAME) ?: return
		schemas[EMPTY_SCHEMA_NAME] = rawSchema.addProperty(ApiResponse<*>::data.name, Schema<Any>().typesItem(NULL_TYPE))
		openApi.paths.orEmpty().values
			.flatMap { it.readOperations() }
			.flatMap { it.responses.orEmpty().values }
			.flatMap { it.content.orEmpty().values }
			.filter { it.schema?.`$ref` == RAW_SCHEMA_REF }
			.forEach { it.schema = Schema<Any>().`$ref`(EMPTY_SCHEMA_NAME) }
	}

	companion object {
		private val RAW_SCHEMA_NAME = checkNotNull(ApiResponse::class.simpleName)
		private val RAW_SCHEMA_REF = "#/components/schemas/$RAW_SCHEMA_NAME"
		private const val EMPTY_SCHEMA_NAME = "EmptyApiResponse"
		private const val NULL_TYPE = "null"
	}
}
