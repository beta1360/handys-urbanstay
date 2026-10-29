package com.marco.assignment.handys.urbanstay.hotel.entity

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.Version

@Entity
class Hotel(
	name: String,
	address: String,
	phone: String,
	description: String?,
) : BaseEntity() {

	var name: String = normalize(name)
		protected set

	var address: String = normalize(address)
		protected set

	var phone: String = normalize(phone)
		protected set

	var description: String? = normalizeOptional(description)
		protected set

	@Version
	var version: Long = 0
		protected set

	fun update(name: String, address: String, phone: String, description: String?) {
		this.name = normalize(name)
		this.address = normalize(address)
		this.phone = normalize(phone)
		this.description = normalizeOptional(description)
	}

	companion object {
		const val NAME_MAX_LENGTH = 100
		const val ADDRESS_MAX_LENGTH = 200
		const val PHONE_MAX_LENGTH = 20
		const val DESCRIPTION_MAX_LENGTH = 1000
		const val PHONE_PATTERN = "^-*([0-9]-*){8,11}$"
		const val NAME_ADDRESS_UNIQUE_CONSTRAINT = "hotel_name_address_key"

		fun normalize(value: String): String = value.trim()

		private fun normalizeOptional(value: String?): String? = value?.let(::normalize)?.ifEmpty { null }
	}
}
