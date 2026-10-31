package com.marco.assignment.handys.urbanstay.common.repository

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.Expression
import jakarta.persistence.criteria.Predicate
import org.hibernate.query.criteria.HibernateCriteriaBuilder
import org.springframework.data.jpa.repository.query.EscapeCharacter

object SearchPredicates {

	private val ESCAPE = EscapeCharacter.DEFAULT
	private const val HYPHEN = "-"

	fun containsIgnoreCase(builder: CriteriaBuilder, value: Expression<String>, keyword: String): Predicate =
		like(builder, builder.upper(value), builder.upper(bind(builder, contains(keyword))))

	fun phoneContains(builder: CriteriaBuilder, phone: Expression<String>, keyword: String): Predicate? {
		val digits = keyword.replace(HYPHEN, "")
		if (digits.isEmpty()) {
			return null
		}
		return like(builder, builder.replace(phone, HYPHEN, ""), bind(builder, contains(digits)))
	}

	private fun like(builder: CriteriaBuilder, value: Expression<String>, pattern: Expression<String>): Predicate =
		builder.like(value, pattern, ESCAPE.escapeCharacter)

	private fun contains(keyword: String): String = "%${ESCAPE.escape(keyword)}%"

	private fun bind(builder: CriteriaBuilder, value: String): Expression<String> = (builder as HibernateCriteriaBuilder).value(value)
}
