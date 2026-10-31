package com.marco.assignment.handys.urbanstay.stay.service

import com.marco.assignment.handys.urbanstay.room.entity.RoomType

data class RoomTypeAvailability(
	val roomType: RoomType,
	val roomCount: Int,
	val availableCount: Int,
)
