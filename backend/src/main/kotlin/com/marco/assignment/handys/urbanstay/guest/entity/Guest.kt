package com.marco.assignment.handys.urbanstay.guest.entity

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import com.marco.assignment.handys.urbanstay.member.entity.Member
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Version

@Entity
class Guest(
	hotel: Hotel,
	name: String,
	phone: String,
	email: String,
) : BaseEntity() {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var hotel: Hotel = hotel
		protected set

	var name: String = normalize(name)
		protected set

	var phone: String = normalize(phone)
		protected set

	var email: String = normalize(email)
		protected set

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(updatable = false)
	var member: Member? = null
		protected set

	@Version
	var version: Long = 0
		protected set

	fun update(name: String, phone: String, email: String) {
		this.name = normalize(name)
		this.phone = normalize(phone)
		this.email = normalize(email)
	}

	companion object {
		const val NAME_MAX_LENGTH = 50
		const val PHONE_MAX_LENGTH = Hotel.PHONE_MAX_LENGTH
		const val EMAIL_MAX_LENGTH = 254
		const val HOTEL_PHONE_UNIQUE_CONSTRAINT = "guest_hotel_id_phone_digits_key"

		fun normalize(value: String): String = value.trim()

		fun removeHyphens(value: String): String = value.replace("-", "")
	}
}
