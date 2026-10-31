package com.marco.assignment.handys.urbanstay.member.entity

import com.marco.assignment.handys.urbanstay.account.entity.LoginId
import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import jakarta.persistence.Entity

@Entity
class Member(
	email: String,
	passwordHash: String,
	name: String,
	phone: String,
) : BaseEntity() {

	var email: String = LoginId.normalize(email)
		protected set

	var passwordHash: String = passwordHash
		protected set

	var name: String = name.trim()
		protected set

	var phone: String = phone.trim()
		protected set

	companion object {
		const val EMAIL_MAX_LENGTH = 254
		const val NAME_MAX_LENGTH = 50
		const val PHONE_MAX_LENGTH = Hotel.PHONE_MAX_LENGTH
		const val EMAIL_UNIQUE_CONSTRAINT = "member_email_key"
	}
}
