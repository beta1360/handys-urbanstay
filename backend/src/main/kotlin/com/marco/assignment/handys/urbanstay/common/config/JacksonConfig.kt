package com.marco.assignment.handys.urbanstay.common.config

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.core.JsonParser
import tools.jackson.core.JsonToken
import tools.jackson.databind.BeanDescription
import tools.jackson.databind.DeserializationConfig
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.JacksonModule
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.cfg.CoercionAction
import tools.jackson.databind.cfg.CoercionInputShape
import tools.jackson.databind.deser.ValueDeserializerModifier
import tools.jackson.databind.deser.std.DelegatingDeserializer
import tools.jackson.databind.ext.javatime.ser.LocalTimeSerializer
import tools.jackson.databind.module.SimpleModule
import tools.jackson.databind.type.LogicalType
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.format.ResolverStyle

@Configuration(proxyBeanMethods = false)
class JacksonConfig {

	@Bean
	fun textCoercionCustomizer(): JsonMapperBuilderCustomizer =
		JsonMapperBuilderCustomizer { builder ->
			builder.withCoercionConfig(LogicalType.Textual) { config ->
				SCALAR_SHAPES.forEach { config.setCoercion(it, CoercionAction.Fail) }
			}
		}

	@Bean
	fun isoDateTimeModule(): JacksonModule =
		SimpleModule()
			.setDeserializerModifier(IsoDateTimeDeserializerModifier())
			.addSerializer(LocalTime::class.java, LocalTimeSerializer(LOCAL_TIME_FORMATTER))

	private class IsoDateTimeDeserializerModifier : ValueDeserializerModifier() {

		override fun modifyDeserializer(
			config: DeserializationConfig,
			beanDescRef: BeanDescription.Supplier,
			deserializer: ValueDeserializer<*>,
		): ValueDeserializer<*> =
			ISO_FORMATTERS[beanDescRef.type.rawClass]?.let { IsoStringDeserializer(deserializer, it) } ?: deserializer
	}

	// Jackson 기본 날짜·시간 처리는 배열·숫자·숫자 문자열도 받아 준다.
	// 기본 처리를 바꾸지 않고(OffsetDateTime의 UTC 변환 유지) 앞에서 ISO 문자열만 통과시킨다.
	private class IsoStringDeserializer(
		delegatee: ValueDeserializer<*>,
		private val formatter: DateTimeFormatter,
	) : DelegatingDeserializer(delegatee) {

		override fun newDelegatingInstance(newDelegatee: ValueDeserializer<*>): ValueDeserializer<*> =
			IsoStringDeserializer(newDelegatee, formatter)

		override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Any? {
			if (!p.hasToken(JsonToken.VALUE_STRING)) {
				return ctxt.handleUnexpectedToken(handledType(), p)
			}
			try {
				formatter.parse(p.string)
			} catch (e: DateTimeParseException) {
				return ctxt.handleWeirdStringValue(handledType(), p.string, "not an ISO-8601 value")
			}
			return super.deserialize(p, ctxt)
		}
	}

	companion object {
		const val LOCAL_TIME_PATTERN = "^([01][0-9]|2[0-3]):[0-5][0-9]$"
		private val SCALAR_SHAPES = listOf(CoercionInputShape.Integer, CoercionInputShape.Float, CoercionInputShape.Boolean)
		private val LOCAL_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm").withResolverStyle(ResolverStyle.STRICT)
		private val ISO_FORMATTERS = mapOf(
			LocalDate::class.java to DateTimeFormatter.ISO_LOCAL_DATE,
			LocalDateTime::class.java to DateTimeFormatter.ISO_LOCAL_DATE_TIME,
			OffsetDateTime::class.java to DateTimeFormatter.ISO_OFFSET_DATE_TIME,
			LocalTime::class.java to LOCAL_TIME_FORMATTER,
		)
	}
}
