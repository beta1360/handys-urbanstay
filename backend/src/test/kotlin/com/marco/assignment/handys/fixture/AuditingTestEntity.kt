package com.marco.assignment.handys.fixture

import com.marco.assignment.handys.urbanstay.common.entity.BaseEntity
import jakarta.persistence.Entity

@Entity
class AuditingTestEntity(
	var name: String,
) : BaseEntity()
