package com.marco.assignment.handys.urbanstay

import org.springframework.boot.flyway.autoconfigure.FlywayConfigurationCustomizer
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName
import java.util.concurrent.atomic.AtomicBoolean

@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	fun postgresContainer(): PostgreSQLContainer {
		return PostgreSQLContainer(DockerImageName.parse("postgres:18")).withReuse(true)
	}

	@Bean
	fun sharedMigrations(): FlywayConfigurationCustomizer = FlywayConfigurationCustomizer { configuration ->
		configuration.locations(*MIGRATION_LOCATIONS).cleanDisabled(false)
	}

	@Bean
	fun cleanOncePerRun(): FlywayMigrationStrategy = FlywayMigrationStrategy { flyway ->
		// 캐시된 테스트 컨텍스트들이 같은 DB를 쓰므로, 이미 마이그레이션한 스키마를 지우지 않도록 테스트 실행(JVM)당 한 번만 초기화한다.
		if (cleaned.compareAndSet(false, true)) {
			flyway.clean()
		}
		flyway.migrate()
	}

	companion object {
		private val MIGRATION_LOCATIONS = arrayOf("classpath:db/migration", "classpath:db/test-migration")
		private val cleaned = AtomicBoolean(false)
	}
}
