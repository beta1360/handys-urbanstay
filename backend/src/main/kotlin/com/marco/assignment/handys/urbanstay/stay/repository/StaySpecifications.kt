package com.marco.assignment.handys.urbanstay.stay.repository

import com.marco.assignment.handys.urbanstay.common.repository.SearchPredicates
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import org.springframework.data.jpa.domain.Specification
import java.time.Instant
import java.time.LocalDate

object StaySpecifications {

	fun search(
		hotelId: Long,
		roomId: Long?,
		guestId: Long?,
		canceled: Boolean?,
		keyword: String?,
		checkInFrom: LocalDate?,
		checkInTo: LocalDate?,
	): Specification<Stay> =
		Specification { root, _, builder ->
			val room = root.get<Room>(Stay::room.name)
			val guest = root.get<Guest>(Stay::guest.name)
			val canceledAt = root.get<Instant>(Stay::canceledAt.name)
			val checkInDate = root.get<LocalDate>(Stay::checkInDate.name)
			val conditions = listOfNotNull(
				builder.equal(room.get<Hotel>(Room::hotel.name).get<Long>(Hotel::id.name), hotelId),
				roomId?.let { builder.equal(room.get<Long>(Room::id.name), it) },
				guestId?.let { builder.equal(guest.get<Long>(Guest::id.name), it) },
				canceled?.let { if (it) builder.isNotNull(canceledAt) else builder.isNull(canceledAt) },
				keyword?.let {
					val matches = listOfNotNull(
						SearchPredicates.containsIgnoreCase(builder, guest.get(Guest::name.name), it),
						SearchPredicates.phoneContains(builder, guest.get(Guest::phone.name), it),
					)
					builder.or(*matches.toTypedArray())
				},
				checkInFrom?.let { builder.greaterThanOrEqualTo(checkInDate, it) },
				checkInTo?.let { builder.lessThanOrEqualTo(checkInDate, it) },
			)
			builder.and(*conditions.toTypedArray())
		}
}
