package com.marco.assignment.handys.urbanstay.common.validation

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [PatternThenMaxLengthValidator::class])
annotation class PatternThenMaxLength(
	val regexp: String,
	val max: Int,
	val message: String,
	val maxLengthMessage: String = "{validation.max-length}",
	val groups: Array<KClass<*>> = [],
	val payload: Array<KClass<out Payload>> = [],
)

class PatternThenMaxLengthValidator : ConstraintValidator<PatternThenMaxLength, String> {

	private lateinit var regex: Regex
	private var max: Int = 0
	private lateinit var maxLengthMessage: String

	override fun initialize(constraintAnnotation: PatternThenMaxLength) {
		regex = Regex(constraintAnnotation.regexp)
		max = constraintAnnotation.max
		maxLengthMessage = constraintAnnotation.maxLengthMessage
	}

	override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
		if (value.isNullOrEmpty()) {
			return true
		}
		if (!regex.matches(value)) {
			return false
		}
		if (value.length <= max) {
			return true
		}
		context.disableDefaultConstraintViolation()
		context.buildConstraintViolationWithTemplate(maxLengthMessage).addConstraintViolation()
		return false
	}
}
