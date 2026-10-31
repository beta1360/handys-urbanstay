package com.marco.assignment.handys.urbanstay.stay.service

data class RoomTypeAvailability(
	val type: String,
	val roomCount: Int,
	val maxGuests: Int,
	val availableCount: Int,
)
