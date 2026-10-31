package com.marco.assignment.handys.urbanstay.member.dto.appadmin

import com.marco.assignment.handys.urbanstay.member.entity.Member
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class MemberAppAdminResponse(
	@Schema(description = "openapi.schema.MemberAppAdminResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.MemberAppAdminResponse.email", example = "guest@example.com")
	val email: String,
	@Schema(description = "openapi.schema.MemberAppAdminResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.MemberAppAdminResponse.phone", example = "010-1234-5678")
	val phone: String,
	@Schema(description = "openapi.schema.MemberAppAdminResponse.createdAt", example = "2026-10-30T06:59:32.123456Z")
	val createdAt: Instant,
) {

	companion object {

		fun from(member: Member): MemberAppAdminResponse =
			MemberAppAdminResponse(checkNotNull(member.id), member.email, member.name, member.phone, member.createdAt)
	}
}
