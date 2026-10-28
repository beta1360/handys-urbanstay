package com.marco.assignment.handys.urbanstay.common.config

import com.marco.assignment.handys.urbanstay.common.ApiPaths
import com.marco.assignment.handys.urbanstay.common.exception.SecurityErrorHandler
import com.marco.assignment.handys.urbanstay.common.security.Role
import jakarta.servlet.DispatcherType
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.savedrequest.NullRequestCache

@Configuration(proxyBeanMethods = false)
class SecurityConfig(private val securityErrorHandler: SecurityErrorHandler) {

	@Bean
	@Order(1)
	fun adminSecurityFilterChain(http: HttpSecurity): SecurityFilterChain =
		http.securityMatcher(APP_ADMIN_PATTERN, HOTEL_ADMIN_PATTERN)
			.authorizeHttpRequests {
				it.requestMatchers(APP_ADMIN_PATTERN).hasRole(Role.APP_ADMIN.name)
					.requestMatchers(HOTEL_ADMIN_PATTERN).hasRole(Role.HOTEL_ADMIN.name)
			}
			.csrf { it.spa() }
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

	private fun HttpSecurity.applyCommonSettings(): HttpSecurity =
		formLogin { it.disable() }
			.httpBasic { it.disable() }
			.logout { it.disable() }
			.requestCache { it.requestCache(NullRequestCache()) }
			.exceptionHandling { it.authenticationEntryPoint(securityErrorHandler).accessDeniedHandler(securityErrorHandler) }

	companion object {
		private const val APP_PATTERN = "${ApiPaths.APP}/**"
		private const val APP_ADMIN_PATTERN = "${ApiPaths.APP_ADMIN}/**"
		private const val HOTEL_ADMIN_PATTERN = "${ApiPaths.HOTEL_ADMIN}/**"
		private val DOCS_PATTERNS = arrayOf("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**")
	}
}
