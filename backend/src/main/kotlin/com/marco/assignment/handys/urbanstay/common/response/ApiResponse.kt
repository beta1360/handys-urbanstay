package com.marco.assignment.handys.urbanstay.common.response

data class ApiResponse<T>(
	val success: Boolean,
	val data: T?,
	val error: ErrorResponse?,
) {

	companion object {

		fun <T> success(data: T): ApiResponse<T> = ApiResponse(true, data, null)

		fun failure(error: ErrorResponse): ApiResponse<Nothing> = ApiResponse(false, null, error)
	}
}
