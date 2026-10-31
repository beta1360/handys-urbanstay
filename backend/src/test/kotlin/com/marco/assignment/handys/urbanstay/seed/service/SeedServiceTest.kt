package com.marco.assignment.handys.urbanstay.seed.service

import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.seed.config.SeedConfig
import com.marco.assignment.handys.urbanstay.seed.config.SeedProperties
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class SeedServiceTest {

	@Autowired
	private lateinit var seedService: SeedService

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	@Autowired
	private lateinit var clock: Clock

	@Autowired
	@Qualifier("seedRunner")
	private lateinit var seedRunner: ApplicationRunner

	@BeforeEach
	fun deleteAllInTestTransaction() {
		DELETE_ORDER.forEach { jdbcTemplate.update("delete from $it") }
	}

	@Test
	fun `설정이 켜져 있고 호텔이 없으면 더미 데이터를 넣고 다시 실행해도 늘지 않는다`() {
		val runner = SeedConfig().seedRunner(seedService, SeedProperties(enabled = true))

		runner.run(DefaultApplicationArguments())
		val seeded = counts()
		runner.run(DefaultApplicationArguments())

		assertThat(counts()).isEqualTo(seeded)
		assertThat(seeded)
			.containsEntry("hotel", 3)
			.containsEntry("hotel_admin", 9)
			.containsEntry("room_type", 9)
			.containsEntry("room", 30)
			.containsEntry("member", 10)
		assertThat(seeded.getValue("stay")).isBetween(30, 40)
		assertThat(count("stay where canceled_at is not null")).isBetween(3, 5)
		assertThat(count("guest where member_id is null")).isPositive()
		assertThat(count("guest where member_id is not null")).isPositive()
		assertThat(jdbcTemplate.queryForList("select distinct status from room", String::class.java))
			.containsExactlyInAnyOrder("VACANT", "RESERVED", "OCCUPIED", "MAINTENANCE")

		val today = LocalDate.now(clock)
		val currentStays = jdbcTemplate.queryForObject(
			"select count(*) from stay where canceled_at is null and check_in_date <= ? and check_out_date > ?",
			Int::class.java,
			today,
			today,
		)
		assertThat(currentStays).isPositive()
		val months = jdbcTemplate.queryForList("select distinct date_trunc('month', check_in_date)::date from stay", LocalDate::class.java)
		val thisMonth = today.withDayOfMonth(1)
		assertThat(months).contains(thisMonth.minusMonths(1), thisMonth, thisMonth.plusMonths(1))

		val passwordHash = jdbcTemplate.queryForObject(
			"select password_hash from member where email = ?",
			String::class.java,
			"member1@${SeedService.DOMAIN}",
		)
		assertThat(passwordEncoder.matches(SeedService.PASSWORD, passwordHash)).isTrue()
	}

	@Test
	fun `테스트 설정에서는 꺼져 있어 시작 시 러너가 아무것도 넣지 않는다`() {
		seedRunner.run(DefaultApplicationArguments())

		assertThat(count("hotel")).isZero()
		assertThat(count("member")).isZero()
	}

	private fun counts(): Map<String, Int> = COUNTED_TABLES.associateWith { count(it) }

	private fun count(from: String): Int = checkNotNull(jdbcTemplate.queryForObject("select count(*) from $from", Int::class.java))

	companion object {
		private val DELETE_ORDER = listOf("stay", "room_status_history", "room", "room_type", "guest", "hotel_admin", "hotel", "member")
		private val COUNTED_TABLES = listOf("hotel", "hotel_admin", "room_type", "room", "room_status_history", "member", "guest", "stay")
	}
}
