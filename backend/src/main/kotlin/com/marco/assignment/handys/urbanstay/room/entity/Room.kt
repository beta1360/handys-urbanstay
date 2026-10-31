package com.marco.assignment.handys.urbanstay.room.entity

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.ManyToOne
import jakarta.persistence.Version

@Entity
class Room(
	hotel: Hotel,
	name: String,
	roomType: RoomType,
	floor: Int?,
	description: String?,
) : BaseEntity() {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var hotel: Hotel = hotel
		protected set

	var name: String = normalize(name)
		protected set

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var roomType: RoomType = roomType
		protected set

	var floor: Int? = floor
		protected set

	var description: String? = normalizeOptional(description)
		protected set

	@Enumerated(EnumType.STRING)
	// 상태는 RoomRepository.updateStatus(조건부 UPDATE)로만 바꾼다.
	// 객실 수정의 JPA UPDATE가 그사이 바뀐 상태를 읽어 둔 옛 값으로 덮어쓰지 않도록 UPDATE 컬럼에서 뺀다.
	@Column(updatable = false)
	var status: RoomStatus = RoomStatus.VACANT
		protected set

	@Version
	var version: Long = 0
		protected set

	fun update(name: String, roomType: RoomType, floor: Int?, description: String?) {
		this.name = normalize(name)
		this.roomType = roomType
		this.floor = floor
		this.description = normalizeOptional(description)
	}

	companion object {
		const val NAME_MAX_LENGTH = 50
		const val MIN_FLOOR = -10L
		const val MAX_FLOOR = 200L
		const val DESCRIPTION_MAX_LENGTH = 1000
		const val HOTEL_NAME_UNIQUE_CONSTRAINT = "room_hotel_id_name_key"

		fun normalize(value: String): String = value.trim()

		private fun normalizeOptional(value: String?): String? = value?.let(::normalize)?.ifEmpty { null }
	}
}
