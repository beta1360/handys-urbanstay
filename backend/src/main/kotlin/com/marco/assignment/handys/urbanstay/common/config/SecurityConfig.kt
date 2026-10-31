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
	fun defaultSecurityFilterChain(http: HttpSecurity): SecurityFilterChain =
		http.authorizeHttpRequests {
			it.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
				.requestMatchers(APP_PATTERN, *DOCS_PATTERNS).permitAll()
				.anyRequest().denyAll()
		}
			.csrf { it.disable() }
			.applyCommonSettings()
			.build()

	@Bean
	fun loginSessionHandler(@Value("\${server.servlet.session.cookie.name}") sessionCookieName: String): LoginSessionHandler =
		LoginSessionHandler(adminCsrfTokenRepository, adminSecurityContextRepository, sessionCookieName)

	private fun HttpSecurity.applyCommonSettings(): HttpSecurity =
		formLogin { it.disable() }
			.httpBasic { it.disable() }
			.logout { it.disable() }
			.requestCache { it.requestCache(NullRequestCache()) }
			.exceptionHandling { it.authenticationEntryPoint(securityErrorHandler).accessDeniedHandler(securityErrorHandler) }

	data class AdminApi(val method: HttpMethod, val path: String)

	companion object {
		val PUBLIC_ADMIN_APIS = listOf(
			AdminApi(HttpMethod.POST, ApiPaths.APP_ADMIN + ApiPaths.AUTH + ApiPaths.LOGIN),
			AdminApi(HttpMethod.POST, ApiPaths.HOTEL_ADMIN + ApiPaths.AUTH + ApiPaths.LOGIN),
		)
		private val HOTEL_MASTER_APIS = listOf(
			AdminApi(HttpMethod.POST, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOM_TYPES),
			AdminApi(HttpMethod.PUT, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOM_TYPES + "/*"),
			AdminApi(HttpMethod.POST, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOMS),
			AdminApi(HttpMethod.PUT, ApiPaths.HOTEL_ADMIN + ApiPaths.ROOMS + "/*"),
		)
		private const val APP_PATTERN = "${ApiPaths.APP}/**"
		private const val APP_ADMIN_PATTERN = "${ApiPaths.APP_ADMIN}/**"
		private const val HOTEL_ADMIN_PATTERN = "${ApiPaths.HOTEL_ADMIN}/**"
		private const val HOTEL_MASTER_PATTERN = "${ApiPaths.HOTEL_ADMIN}${ApiPaths.OPERATORS}/**"
		private val DOCS_PATTERNS = arrayOf("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**")

		fun isPublicAdminApi(method: String, path: String): Boolean =
			PUBLIC_ADMIN_APIS.any { it.method.matches(method) && it.path == path }
	}
}
