package com.marco.assignment.handys.urbanstay.account.entity

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.Version

@Entity
class AppAdmin(
	loginId: String,
	passwordHash: String,
	name: String,
) : BaseEntity() {

	var loginId: String = LoginId.normalize(loginId)
		protected set

	var passwordHash: String = passwordHash
		protected set

	var name: String = normalizeName(name)
		protected set

	@Version
	var version: Long = 0
		protected set

	fun rename(name: String) {
		this.name = normalizeName(name)
	}

	companion object {
		const val LOGIN_ID_MAX_LENGTH = 254
		const val NAME_MAX_LENGTH = 50
		const val LOGIN_ID_UNIQUE_CONSTRAINT = "app_admin_login_id_key"

		private fun normalizeName(name: String): String = name.trim()
	}
}
