package com.marco.assignment.handys.urbanstay.member.repository

import com.marco.assignment.handys.urbanstay.member.entity.Member
import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.Expression
import jakarta.persistence.criteria.Predicate
import org.hibernate.query.criteria.HibernateCriteriaBuilder
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.query.EscapeCharacter

object MemberSpecifications {

	private val ESCAPE = EscapeCharacter.DEFAULT

	fun search(keyword: String?): Specification<Member> =
		Specification { root, _, builder ->
			if (keyword == null) {
				return@Specification builder.conjunction()
			}
			val pattern = value(builder, contains(keyword))
			val conditions = listOfNotNull(
				like(builder, builder.upper(root.get(Member::name.name)), builder.upper(pattern)),
				like(builder, builder.upper(root.get(Member::email.name)), builder.upper(pattern)),
				keyword.replace("-", "").ifEmpty { null }?.let { digits ->
					like(builder, builder.replace(root.get(Member::phone.name), "-", ""), value(builder, contains(digits)))
				},
			)
			builder.or(*conditions.toTypedArray())
		}

	private fun like(builder: CriteriaBuilder, value: Expression<String>, pattern: Expression<String>): Predicate =
		builder.like(value, pattern, ESCAPE.escapeCharacter)

	private fun contains(keyword: String): String = "%${ESCAPE.escape(keyword)}%"

	private fun value(builder: CriteriaBuilder, value: String): Expression<String> = (builder as HibernateCriteriaBuilder).value(value)
}
