package com.marco.assignment.handys.urbanstay.account.entity

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.ManyToOne
import jakarta.persistence.Version

@Entity
class HotelAdmin(
	hotel: Hotel,
	loginId: String,
	passwordHash: String,
	name: String,
	role: HotelAdminRole,
) : BaseEntity() {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	var hotel: Hotel = hotel
		protected set

	var loginId: String = LoginId.normalize(loginId)
		protected set

	var passwordHash: String = passwordHash
		protected set

	var name: String = normalizeName(name)
		protected set

	@Enumerated(EnumType.STRING)
	var role: HotelAdminRole = role
		protected set

	var active: Boolean = true
		protected set

	var credentialVersion: Long = 0
		protected set

	@Version
	var version: Long = 0
		protected set

	fun update(loginId: String, name: String) {
		val normalizedLoginId = LoginId.normalize(loginId)
		if (normalizedLoginId != this.loginId) {
			this.loginId = normalizedLoginId
			credentialVersion++
		}
		this.name = normalizeName(name)
	}

	fun resetPassword(passwordHash: String) {
		this.passwordHash = passwordHash
		credentialVersion++
	}

	companion object {
		const val LOGIN_ID_MAX_LENGTH = 254
		const val NAME_MAX_LENGTH = 50
		const val LOGIN_ID_UNIQUE_CONSTRAINT = "hotel_admin_login_id_key"
		const val MASTER_UNIQUE_CONSTRAINT = "hotel_admin_master_key"

		private fun normalizeName(name: String): String = name.trim()
	}
}
