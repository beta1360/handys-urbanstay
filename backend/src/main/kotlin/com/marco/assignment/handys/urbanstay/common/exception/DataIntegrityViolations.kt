package com.marco.assignment.handys.urbanstay.common.exception

import org.hibernate.exception.ConstraintViolationException
import org.springframework.dao.DataIntegrityViolationException

fun DataIntegrityViolationException.violates(constraintName: String): Boolean =
	generateSequence<Throwable>(this) { it.cause }
		.filterIsInstance<ConstraintViolationException>()
		.any { it.constraintName == constraintName }
