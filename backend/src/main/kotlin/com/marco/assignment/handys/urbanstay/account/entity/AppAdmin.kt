package com.marco.assignment.handys.urbanstay.account.entity

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import jakarta.persistence.Entity

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

	var name: String = name
		protected set

	companion object {
		const val LOGIN_ID_MAX_LENGTH = 254
		const val NAME_MAX_LENGTH = 50
	}
}
