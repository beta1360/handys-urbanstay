package com.marco.assignment.handys.urbanstay.hotel.repository

import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel

data class HotelRoomCount(
	val hotel: Hotel,
	val roomCount: Long,
)
