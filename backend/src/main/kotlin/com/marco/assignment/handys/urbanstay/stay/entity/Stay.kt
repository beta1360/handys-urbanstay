package com.marco.assignment.handys.urbanstay.stay.entity

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.room.entity.Room
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.ManyToOne
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Entity
class Stay(
	room: Room,
	guest: Guest,
	checkInDate: LocalDate,
	checkOutDate: LocalDate,
	guestCount: Int,
	roomRate: Int,
) : BaseEntity() {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var room: Room = room
		protected set

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var guest: Guest = guest
		protected set

	var checkInDate: LocalDate = checkInDate
		protected set

	var checkOutDate: LocalDate = checkOutDate
		protected set

	var guestCount: Int = guestCount
		protected set

	var roomRate: Int = roomRate
		protected set

	var nights: Int = ChronoUnit.DAYS.between(checkInDate, checkOutDate).toInt()
		protected set

	var baseAmount: Int = roomRate * nights
		protected set

	var discountAmount: Int = 0
		protected set

	var totalAmount: Int = baseAmount - discountAmount
		protected set

	var canceledAt: Instant? = null
		protected set

	@ManyToOne(fetch = FetchType.LAZY)
	var canceledBy: HotelAdmin? = null
		protected set

	var canceledByName: String? = null
		protected set

	var cancelReason: String? = null
		protected set

	companion object {
		const val MIN_GUEST_COUNT = 1L
		const val MAX_NIGHTS = 30L
		const val CANCEL_REASON_MAX_LENGTH = 200
		const val ROOM_PERIOD_EXCLUSION_CONSTRAINT = "stay_room_id_period_excl"

		fun normalizeCancelReason(reason: String?): String? = reason?.trim()?.ifEmpty { null }
	}
}
