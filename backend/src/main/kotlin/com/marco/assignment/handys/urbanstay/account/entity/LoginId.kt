package com.marco.assignment.handys.urbanstay.account.entity

object LoginId {

	const val PATTERN = "^[\\x21-\\x3F\\x41-\\x7E]+@[\\x21-\\x2D\\x2F-\\x3F\\x41-\\x7E]+(\\.[\\x21-\\x2D\\x2F-\\x3F\\x41-\\x7E]+)+$"

	fun normalize(loginId: String): String = loginId.trim().lowercase()
}
