package com.marco.assignment.handys.urbanstay.hotel.repository

import com.marco.assignment.handys.urbanstay.common.repository.SearchPredicates
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import org.springframework.data.jpa.domain.Specification

object HotelSpecifications {

	fun search(keyword: String): Specification<Hotel> =
		Specification { root, _, builder ->
			val conditions = listOfNotNull(
				SearchPredicates.containsIgnoreCase(builder, root.get(Hotel::name.name), keyword),
				SearchPredicates.containsIgnoreCase(builder, root.get(Hotel::address.name), keyword),
				SearchPredicates.phoneContains(builder, root.get(Hotel::phone.name), keyword),
			)
			builder.or(*conditions.toTypedArray())
		}
}
