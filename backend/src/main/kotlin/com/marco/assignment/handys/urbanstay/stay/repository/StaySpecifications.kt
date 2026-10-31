package com.marco.assignment.handys.urbanstay.stay.repository

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.room.entity.Room
import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import org.springframework.data.jpa.domain.Specification
import java.time.Instant

object StaySpecifications {

	fun search(hotelId: Long, roomId: Long?, guestId: Long?, canceled: Boolean?): Specification<Stay> =
		Specification { root, _, builder ->
			val room = root.get<Room>(Stay::room.name)
			val canceledAt = root.get<Instant>(Stay::canceledAt.name)
			val conditions = listOfNotNull(
				builder.equal(room.get<Hotel>(Room::hotel.name).get<Long>(Hotel::id.name), hotelId),
				roomId?.let { builder.equal(room.get<Long>(Room::id.name), it) },
				guestId?.let { builder.equal(root.get<Guest>(Stay::guest.name).get<Long>(Guest::id.name), it) },
				canceled?.let { if (it) builder.isNotNull(canceledAt) else builder.isNull(canceledAt) },
			)
			builder.and(*conditions.toTypedArray())
		}
}
