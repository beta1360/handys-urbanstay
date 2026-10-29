package com.marco.assignment.handys.urbanstay.common.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.ObjectProvider
import org.springframework.security.core.context.DeferredSecurityContext
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.context.HttpRequestResponseHolder
import org.springframework.security.web.context.SecurityContextRepository

class VerifyingSecurityContextRepository(
	private val delegate: SecurityContextRepository,
	private val verifiers: ObjectProvider<SessionAuthenticationVerifier>,
) : SecurityContextRepository {

	private val securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy()

	@Deprecated("Use loadDeferredContext", ReplaceWith("loadDeferredContext(requestResponseHolder.request)"))
	override fun loadContext(requestResponseHolder: HttpRequestResponseHolder): SecurityContext =
		verify(delegate.loadContext(requestResponseHolder), requestResponseHolder.request)
			?: securityContextHolderStrategy.createEmptyContext()

	override fun loadDeferredContext(request: HttpServletRequest): DeferredSecurityContext =
		VerifiedDeferredSecurityContext(delegate.loadDeferredContext(request), request)

	override fun saveContext(context: SecurityContext, request: HttpServletRequest, response: HttpServletResponse) {
		delegate.saveContext(context, request, response)
	}

	override fun containsContext(request: HttpServletRequest): Boolean = delegate.containsContext(request)

	private fun verify(context: SecurityContext, request: HttpServletRequest): SecurityContext? {
		val authentication = context.authentication ?: return context
		if (verifiers.all { it.isValid(authentication) }) {
			return context
		}
		request.getSession(false)?.invalidate()
		return null
	}

	private inner class VerifiedDeferredSecurityContext(
		private val loaded: DeferredSecurityContext,
		private val request: HttpServletRequest,
	) : DeferredSecurityContext {

		private val verified: SecurityContext? by lazy { verify(loaded.get(), request) }

		private val empty: SecurityContext by lazy { securityContextHolderStrategy.createEmptyContext() }

		override fun get(): SecurityContext = verified ?: empty

		override fun isGenerated(): Boolean = verified == null || loaded.isGenerated
	}
}
