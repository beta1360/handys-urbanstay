package com.marco.assignment.handys.urbanstay.account.repository

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.account.entity.HotelAdminRole
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.Expression
import jakarta.persistence.criteria.Predicate
import org.hibernate.query.criteria.HibernateCriteriaBuilder
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.query.EscapeCharacter

object HotelAdminSpecifications {

	private val ESCAPE = EscapeCharacter.DEFAULT

	fun search(hotelId: Long, role: HotelAdminRole, active: Boolean?, keyword: String?): Specification<HotelAdmin> =
		Specification { root, _, builder ->
			val conditions = listOfNotNull(
				builder.equal(root.get<Hotel>(HotelAdmin::hotel.name).get<Long>(Hotel::id.name), hotelId),
				builder.equal(root.get<HotelAdminRole>(HotelAdmin::role.name), role),
				active?.let { builder.equal(root.get<Boolean>(HotelAdmin::active.name), it) },
				keyword?.let {
					builder.or(
						containsIgnoreCase(builder, root.get(HotelAdmin::name.name), it),
						containsIgnoreCase(builder, root.get(HotelAdmin::loginId.name), it),
					)
				},
			)
			builder.and(*conditions.toTypedArray())
		}

	private fun containsIgnoreCase(builder: CriteriaBuilder, value: Expression<String>, keyword: String): Predicate =
		builder.like(
			builder.upper(value),
			builder.upper((builder as HibernateCriteriaBuilder).value("%${ESCAPE.escape(keyword)}%")),
			ESCAPE.escapeCharacter,
		)
}
