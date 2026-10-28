package com.marco.assignment.handys.urbanstay.account.entity

object LoginId {

	fun normalize(loginId: String): String = loginId.trim().lowercase()
}
