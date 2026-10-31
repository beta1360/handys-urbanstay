package com.marco.assignment.handys.urbanstay.room.entity

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.ManyToOne
import jakarta.persistence.Version
import java.time.LocalTime
import java.time.temporal.ChronoUnit

@Entity
class RoomType(
	hotel: Hotel,
	name: String,
	capacity: Int,
	roomRate: Int,
	checkInTime: LocalTime,
	checkOutTime: LocalTime,
) : BaseEntity() {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var hotel: Hotel = hotel
		protected set

	var name: String = normalize(name)
		protected set

	var capacity: Int = capacity
		protected set

	var roomRate: Int = roomRate
		protected set

	var checkInTime: LocalTime = normalizeTime(checkInTime)
		protected set

	var checkOutTime: LocalTime = normalizeTime(checkOutTime)
		protected set

	@Version
	var version: Long = 0
		protected set

	fun update(name: String, capacity: Int, roomRate: Int, checkInTime: LocalTime, checkOutTime: LocalTime) {
		this.name = normalize(name)
		this.capacity = capacity
		this.roomRate = roomRate
		this.checkInTime = normalizeTime(checkInTime)
		this.checkOutTime = normalizeTime(checkOutTime)
	}

	companion object {
		const val NAME_MAX_LENGTH = 50
		const val MIN_CAPACITY = 1L
		const val MAX_CAPACITY = 20L
		const val MIN_ROOM_RATE = 0L
		const val MAX_ROOM_RATE = 10_000_000L
		const val HOTEL_NAME_UNIQUE_CONSTRAINT = "room_type_hotel_id_name_key"

		fun normalize(value: String): String = value.trim()

		private fun normalizeTime(value: LocalTime): LocalTime = value.truncatedTo(ChronoUnit.MINUTES)
	}
}
