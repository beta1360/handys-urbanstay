package com.marco.assignment.handys.urbanstay.member.dto.app

import com.marco.assignment.handys.urbanstay.member.entity.Member
import io.swagger.v3.oas.annotations.media.Schema

data class MemberAppResponse(
	@Schema(description = "openapi.schema.MemberAppResponse.id", example = "1")
	val id: Long,
	@Schema(description = "openapi.schema.MemberAppResponse.email", example = "guest@example.com")
	val email: String,
	@Schema(description = "openapi.schema.MemberAppResponse.name", example = "홍길동")
	val name: String,
	@Schema(description = "openapi.schema.MemberAppResponse.phone", example = "010-1234-5678")
	val phone: String,
) {

	companion object {

		fun from(member: Member): MemberAppResponse = MemberAppResponse(checkNotNull(member.id), member.email, member.name, member.phone)
	}
}
