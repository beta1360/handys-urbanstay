package com.marco.assignment.handys.urbanstay.common.response

import io.swagger.v3.oas.annotations.media.Schema
import org.springframework.data.domain.Page

data class PageResponse<T>(
	@Schema(description = "openapi.schema.PageResponse.items")
	val items: List<T>,
	@Schema(description = "openapi.schema.PageResponse.page", example = "0")
	val page: Int,
	@Schema(description = "openapi.schema.PageResponse.size", example = "10")
	val size: Int,
	@Schema(description = "openapi.schema.PageResponse.totalElements", example = "23")
	val totalElements: Long,
	@Schema(description = "openapi.schema.PageResponse.totalPages", example = "3")
	val totalPages: Int,
) {

	companion object {

		fun <T : Any> from(page: Page<T>): PageResponse<T> =
			PageResponse(page.content, page.number, page.size, page.totalElements, page.totalPages)
	}
}
