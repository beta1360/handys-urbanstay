package com.marco.assignment.handys.urbanstay.common.entity

import com.marco.assignment.handys.fixture.AuditingTestEntity
import com.marco.assignment.handys.urbanstay.TestcontainersConfiguration
import com.marco.assignment.handys.urbanstay.common.config.JpaAuditingConfig
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.persistence.autoconfigure.EntityScan
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate

@DataJpaTest(properties = ["spring.flyway.locations=classpath:db/migration,classpath:db/test-migration"])
@Import(TestcontainersConfiguration::class, JpaAuditingConfig::class)
@EntityScan(basePackageClasses = [AuditingTestEntity::class])
class SchemaConventionTest {

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Test
	fun `모든 테이블은 공통 컬럼 규약을 따른다`() {
		val tables = jdbcTemplate.queryForList(TABLES, String::class.java)
		val definitions = jdbcTemplate.query(COLUMN_DEFINITIONS) { rs, _ ->
			(rs.getString("table_name") to rs.getString("column_name")) to rs.getString("definition")
		}.toMap()

		val violations = tables.flatMap { table ->
			CONVENTION.mapNotNull { (column, expected) ->
				val actual = definitions[table to column]
				"$table.$column: expected [$expected] but was [$actual]".takeIf { actual != expected }
			}
		}

		assertThat(tables).describedAs("검사할 테이블").isNotEmpty()
		assertThat(violations).describedAs("공통 컬럼 규약 위반").isEmpty()
	}

	companion object {
		private val CONVENTION = mapOf(
			"id" to "bigint not null identity primary key",
			"created_at" to "timestamp with time zone not null",
			"updated_at" to "timestamp with time zone not null",
		)

		private const val TABLES = """
			select table_name from information_schema.tables
			where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'flyway_schema_history'
		"""

		private const val COLUMN_DEFINITIONS = """
			select c.table_name, c.column_name, concat_ws(' ',
				c.data_type,
				case when c.is_nullable = 'NO' then 'not null' end,
				case when c.is_identity = 'YES' then 'identity' end,
				case when k.column_name is not null then 'primary key' end
			) as definition
			from information_schema.columns c
			left join information_schema.table_constraints t
				on t.table_schema = c.table_schema and t.table_name = c.table_name and t.constraint_type = 'PRIMARY KEY'
			left join information_schema.key_column_usage k
				on k.constraint_schema = t.constraint_schema and k.constraint_name = t.constraint_name
				and k.table_name = c.table_name and k.column_name = c.column_name
			where c.table_schema = 'public'
		"""
	}
}
