package com.marco.assignment.handys.urbanstay.common.exception

import org.hibernate.exception.ConstraintViolationException
import org.hibernate.exception.spi.TemplatedViolatedConstraintNameExtractor.extractUsingTemplate
import org.springframework.dao.DataIntegrityViolationException

private const val EXCLUSION_VIOLATION_SQL_STATE = "23P01"

fun DataIntegrityViolationException.violates(constraintName: String): Boolean =
	generateSequence<Throwable>(this) { it.cause }
		.filterIsInstance<ConstraintViolationException>()
		.any { it.violatedConstraintName() == constraintName }

// Hibernate의 PostgreSQL 방언은 배제 제약 위반(23P01)의 제약 이름을 뽑지 않아 다른 제약과 같은 메시지 형식에서 직접 뽑는다.
private fun ConstraintViolationException.violatedConstraintName(): String? =
	constraintName ?: sqlException.message?.takeIf { sqlState == EXCLUSION_VIOLATION_SQL_STATE }?.let { extractUsingTemplate("constraint \"", "\"", it) }
