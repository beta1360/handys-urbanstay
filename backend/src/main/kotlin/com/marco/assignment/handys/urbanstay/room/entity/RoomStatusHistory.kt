package com.marco.assignment.handys.urbanstay.room.entity

import com.marco.assignment.handys.urbanstay.account.entity.HotelAdmin
import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.ManyToOne

@Entity
class RoomStatusHistory(
	room: Room,
	fromStatus: RoomStatus?,
	toStatus: RoomStatus,
	changedBy: HotelAdmin,
) : BaseEntity() {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var room: Room = room
		protected set

	@Enumerated(EnumType.STRING)
	var fromStatus: RoomStatus? = fromStatus
		protected set

	@Enumerated(EnumType.STRING)
	var toStatus: RoomStatus = toStatus
		protected set

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var changedBy: HotelAdmin = changedBy
		protected set

	var changedByName: String = changedBy.name
		protected set
}
