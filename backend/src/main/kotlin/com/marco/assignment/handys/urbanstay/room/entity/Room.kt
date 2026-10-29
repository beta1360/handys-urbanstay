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
class Room(
	hotel: Hotel,
	name: String,
	type: String,
	capacity: Int,
	floor: Int?,
	description: String?,
	checkInTime: LocalTime,
	checkOutTime: LocalTime,
) : BaseEntity() {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var hotel: Hotel = hotel
		protected set

	var name: String = normalize(name)
		protected set

	var type: String = normalize(type)
		protected set

	var capacity: Int = capacity
		protected set

	var floor: Int? = floor
		protected set

	var description: String? = normalizeOptional(description)
		protected set

	var checkInTime: LocalTime = normalizeTime(checkInTime)
		protected set

	var checkOutTime: LocalTime = normalizeTime(checkOutTime)
		protected set

	@Version
	var version: Long = 0
		protected set

	fun update(
		name: String,
		type: String,
		capacity: Int,
		floor: Int?,
		description: String?,
		checkInTime: LocalTime,
		checkOutTime: LocalTime,
	) {
		this.name = normalize(name)
		this.type = normalize(type)
		this.capacity = capacity
		this.floor = floor
		this.description = normalizeOptional(description)
		this.checkInTime = normalizeTime(checkInTime)
		this.checkOutTime = normalizeTime(checkOutTime)
	}

	companion object {
		const val NAME_MAX_LENGTH = 50
		const val TYPE_MAX_LENGTH = 50
		const val MIN_CAPACITY = 1L
		const val MAX_CAPACITY = 20L
		const val MIN_FLOOR = -10L
		const val MAX_FLOOR = 200L
		const val DESCRIPTION_MAX_LENGTH = 1000
		const val HOTEL_NAME_UNIQUE_CONSTRAINT = "room_hotel_id_name_key"

		fun normalize(value: String): String = value.trim()

		private fun normalizeOptional(value: String?): String? = value?.let(::normalize)?.ifEmpty { null }

		private fun normalizeTime(value: LocalTime): LocalTime = value.truncatedTo(ChronoUnit.MINUTES)
	}
}
