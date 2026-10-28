package com.marco.assignment.handys.urbanstay.common.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.Operation
import io.swagger.v3.oas.models.media.Schema
import org.springdoc.core.customizers.OpenApiCustomizer
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
class RequiredPropertyCustomizer : OpenApiCustomizer {

	override fun customise(openApi: OpenAPI) {
		val schemas = openApi.components?.schemas ?: return
		val operations = openApi.paths.orEmpty().values.flatMap { it.readOperations() }
		val responseSchemas = reachable(operations.flatMap(::responseRoots), schemas)
		val requestSchemas = reachable(operations.flatMap(::requestRoots), schemas)
		(responseSchemas + requestSchemas).forEach { name ->
			val schema = schemas[name] ?: return@forEach
			val required = schema.properties.orEmpty().filter { (_, property) -> name !in requestSchemas || !property.isNullable() }
			schema.required = required.keys.toList().ifEmpty { null }
		}
	}

	private fun responseRoots(operation: Operation): List<Schema<*>> =
		operation.responses.orEmpty().values.flatMap { it.content.orEmpty().values }.mapNotNull { it.schema }

	private fun requestRoots(operation: Operation): List<Schema<*>> =
		operation.requestBody?.content.orEmpty().values.mapNotNull { it.schema } +
			operation.parameters.orEmpty().mapNotNull { it.schema }

	private fun reachable(roots: List<Schema<*>>, schemas: Map<String, Schema<*>>): Set<String> {
		val found = mutableSetOf<String>()
		val queue = ArrayDeque(roots)
		while (queue.isNotEmpty()) {
			val schema = queue.removeFirst()
			schema.`$ref`?.substringAfterLast('/')?.takeIf(found::add)?.let(schemas::get)?.let(queue::add)
			queue.addAll(schema.properties.orEmpty().values)
			queue.addAll(listOfNotNull(schema.items, schema.additionalProperties as? Schema<*>))
			queue.addAll(schema.allOf.orEmpty() + schema.anyOf.orEmpty() + schema.oneOf.orEmpty())
		}
		return found
	}

	private fun Schema<*>.isNullable(): Boolean =
		NULL_TYPE in types.orEmpty() || oneOf.orEmpty().any { NULL_TYPE in it.types.orEmpty() }

	companion object {
		private const val NULL_TYPE = "null"
	}
}
