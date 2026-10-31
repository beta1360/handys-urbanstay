package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.SecurityErrorHandler
import com.marco.assignment.handys.urbanstay.common.security.LoginSessionHandler
import com.marco.assignment.handys.urbanstay.common.security.Role
import com.marco.assignment.handys.urbanstay.common.security.SessionAuthenticationVerifier
import com.marco.assignment.handys.urbanstay.common.security.VerifyingSecurityContextRepository
import jakarta.servlet.DispatcherType
import org.springframework.beans.factory.ObjectProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.core.annotation.Order
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.context.DelegatingSecurityContextRepository
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository
import org.springframework.security.web.csrf.CookieCsrfTokenRepository
import org.springframework.security.web.savedrequest.NullRequestCache

@Configuration(proxyBeanMethods = false)
class SecurityConfig(
	private val securityErrorHandler: SecurityErrorHandler,
	sessionAuthenticationVerifiers: ObjectProvider<SessionAuthenticationVerifier>,
) {

	private val adminCsrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse()

	private val adminSecurityContextRepository = VerifyingSecurityContextRepository(
		DelegatingSecurityContextRepository(RequestAttributeSecurityContextRepository(), HttpSessionSecurityContextRepository()),
		sessionAuthenticationVerifiers,
	)

	private val memberSecurityContextRepository = DelegatingSecurityContextRepository(
		RequestAttributeSecurityContextRepository(),
		HttpSessionSecurityContextRepository().apply { setSpringSecurityContextKey(MEMBER_SECURITY_CONTEXT_KEY) },
	)

	@Bean
	@Order(1)
	fun adminSecurityFilterChain(http: HttpSecurity): SecurityFilterChain =
		http.securityMatcher(APP_ADMIN_PATTERN, HOTEL_ADMIN_PATTERN)
			.authorizeHttpRequests { registry ->
				PUBLIC_ADMIN_APIS.forEach { registry.requestMatchers(it.method, it.path).permitAll() }
				registry.requestMatchers(APP_ADMIN_PATTERN).hasRole(Role.APP_ADMIN.name)
				HOTEL_MASTER_APIS.forEach { registry.requestMatchers(it.method, it.path).hasRole(Role.HOTEL_MASTER.name) }
				registry.requestMatchers(HOTEL_MASTER_PATTERN).hasRole(Role.HOTEL_MASTER.name)
					.requestMatchers(HOTEL_ADMIN_PATTERN).hasRole(Role.HOTEL_ADMIN.name)
			}
			.csrf { it.spa().csrfTokenRepository(adminCsrfTokenRepository) }
			.securityContext { it.securityContextRepository(adminSecurityContextRepository) }
			.applyCommonSettings()
			.build()

	@Bean
	@Order(2)
	fun appSecurityFilterChain(http: HttpSecurity): SecurityFilterChain =
		http.securityMatcher(APP_PATTERN)
			.authorizeHttpRequests { registry ->
				MEMBER_APIS.forEach { registry.requestMatchers(it.method, it.path).hasRole(Role.MEMBER.name) }
				registry.anyRequest().permitAll()
			}
			.csrf { it.disable() }
			.securityContext { it.securityContextRepository(memberSecurityContextRepository) }
			.applyCommonSettings()
			.build()

	@Bean
	@Order(3)
	fun defaultSecurityFilterChain(http: HttpSecurity): SecurityFilterChain =
		http.authorizeHttpRequests {
			it.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
				.requestMatchers(*DOCS_PATTERNS).permitAll()
				.anyRequest().denyAll()
		}
			.csrf { it.disable() }
			.applyCommonSettings()
			.build()

	@Bean
	@Primary
	fun loginSessionHandler(@Value("\${server.servlet.session.cookie.name}") sessionCookieName: String): LoginSessionHandler =
		LoginSessionHandler(adminCsrfTokenRepository, adminSecurityContextRepository, sessionCookieName)

	@Bean(MEMBER_LOGIN_SESSION_HANDLER)
	fun memberLoginSessionHandler(@Value("\${server.servlet.session.cookie.name}") sessionCookieName: String): LoginSessionHandler =
		LoginSessionHandler(null, memberSecurityContextRepository, sessionCookieName)

	private fun HttpSecurity.applyCommonSettings(): HttpSecurity =
		formLogin { it.disable() }
			.httpBasic { it.disable() }
			.logout { it.disable() }
			.requestCache { it.requestCache(NullRequestCache()) }
			.exceptionHandling { it.authenticationEntryPoint(securityErrorHandler).accessDeniedHandler(securityErrorHandler) }

	data class Endpoint(val method: HttpMethod, val path: String)

	companion object {
		const val MEMBER_LOGIN_SESSION_HANDLER = "memberLoginSessionHandler"
		val PUBLIC_ADMIN_APIS = listOf(
			Endpoint(HttpMethod.POST, ApiPaths.APP_ADMIN + ApiPaths.AUTH + ApiPaths.LOGIN),
			Endpoint(HttpMethod.POST, ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + ApiPaths.LOGIN),
		)
		private val HOTEL_MASTER_APIS = listOf(
			Endpoint(HttpMethod.POST, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOM_TYPES),
			Endpoint(HttpMethod.PUT, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOM_TYPES + "/*"),
			Endpoint(HttpMethod.POST, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOMS),
			Endpoint(HttpMethod.PUT, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOMS + "/*"),
			Endpoint(HttpMethod.GET, ApiPaths.HOTEL_ADMIN + ApiPaths.SETTLEMENTS),
			Endpoint(HttpMethod.GET, ApiPaths.HOTEL_ADMIN + ApiPaths.SETTLEMENTS + "/stays"),
		)
		val MEMBER_APIS = listOf(
			Endpoint(HttpMethod.GET, ApiPaths.APP + ApiPaths.AUTH + "/me"),
			Endpoint(HttpMethod.POST, ApiPaths.APP + ApiPaths.AUTH + "/logout"),
			Endpoint(HttpMethod.POST, ApiPaths.APP + "/stays"),
			Endpoint(HttpMethod.GET, ApiPaths.APP + "/me/stays"),
		)
		private const val MEMBER_SECURITY_CONTEXT_KEY = "URBANSTAY_MEMBER_SECURITY_CONTEXT"
		private const val APP_PATTERN = "${ApiPaths.APP}/**"
		private const val APP_ADMIN_PATTERN = "${ApiPaths.APP_ADMIN}/**"
		private const val HOTEL_ADMIN_PATTERN = "${ApiPaths.HOTEL_ADMIN}/**"
		private const val HOTEL_MASTER_PATTERN = "${ApiPaths.HOTEL_ADMIN}${ApiPaths.OPERATORS}/**"
		private val DOCS_PATTERNS = arrayOf("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**")

		fun isPublicAdminApi(method: String, path: String): Boolean = PUBLIC_ADMIN_APIS.any { it.matches(method, path) }

		fun isMemberApi(method: String, path: String): Boolean = MEMBER_APIS.any { it.matches(method, path) }

		private fun Endpoint.matches(method: String, path: String): Boolean = this.method.matches(method) && this.path == path
	}
}
