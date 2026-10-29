package com.marco.assignment.handys.urbanstay.common.security

import org.springframework.security.core.Authentication

fun interface SessionAuthenticationVerifier {

	fun isValid(authentication: Authentication): Boolean
}
