package com.marco.assignment.handys.urbanstay.guest.repository

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.Expression
import jakarta.persistence.criteria.Predicate
import jakarta.persistence.criteria.Root
import org.hibernate.query.criteria.HibernateCriteriaBuilder
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.query.EscapeCharacter

object GuestSpecifications {

	private val ESCAPE = EscapeCharacter.DEFAULT

	fun search(hotelId: Long, keyword: String?): Specification<Guest> =
		Specification { root, _, builder ->
			val conditions = listOfNotNull(
				inHotel(root, builder, hotelId),
				keyword?.let { matches(root, builder, it) },
			)
			builder.and(*conditions.toTypedArray())
		}

	fun samePhone(hotelId: Long, phone: String, excludedId: Long?): Specification<Guest> =
		Specification { root, _, builder ->
			val conditions = listOfNotNull(
				inHotel(root, builder, hotelId),
				builder.equal(phoneWithoutHyphens(root, builder), value(builder, Guest.removeHyphens(Guest.normalize(phone)))),
				excludedId?.let { builder.notEqual(root.get<Long>(Guest::id.name), it) },
			)
			builder.and(*conditions.toTypedArray())
		}

	private fun inHotel(root: Root<Guest>, builder: CriteriaBuilder, hotelId: Long): Predicate =
		builder.equal(root.get<Hotel>(Guest::hotel.name).get<Long>(Hotel::id.name), hotelId)

	private fun matches(root: Root<Guest>, builder: CriteriaBuilder, keyword: String): Predicate {
		val byName = like(builder, builder.upper(root.get(Guest::name.name)), builder.upper(value(builder, contains(keyword))))
		val phoneKeyword = Guest.removeHyphens(keyword)
		if (phoneKeyword.isEmpty()) {
			return byName
		}
		return builder.or(byName, like(builder, phoneWithoutHyphens(root, builder), value(builder, contains(phoneKeyword))))
	}

	private fun phoneWithoutHyphens(root: Root<Guest>, builder: CriteriaBuilder): Expression<String> =
		builder.replace(root.get(Guest::phone.name), "-", "")

	private fun like(builder: CriteriaBuilder, value: Expression<String>, pattern: Expression<String>): Predicate =
		builder.like(value, pattern, ESCAPE.escapeCharacter)

	private fun contains(keyword: String): String = "%${ESCAPE.escape(keyword)}%"

	private fun value(builder: CriteriaBuilder, value: String): Expression<String> = (builder as HibernateCriteriaBuilder).value(value)
}
