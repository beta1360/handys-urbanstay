package com.marco.assignment.handys.urbanstay.common.validation

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [PasswordValidator::class])
annotation class Password(
	val message: String = "{validation.password}",
	val groups: Array<KClass<*>> = [],
	val payload: Array<KClass<out Payload>> = [],
) {

	companion object {
		const val MIN_LENGTH = 8
		const val MAX_LENGTH = 64
		const val PATTERN = "^(?=.*[A-Za-z])(?=.*[0-9])[\\x20-\\x7E]{$MIN_LENGTH,$MAX_LENGTH}$"
	}
}

class PasswordValidator : ConstraintValidator<Password, String> {

	override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean =
		value.isNullOrBlank() || REGEX.matches(value)

	companion object {
		private val REGEX = Regex(Password.PATTERN)
	}
}
