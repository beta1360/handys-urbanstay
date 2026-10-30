package com.marco.assignment.handys.urbanstay.room.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource

class RoomStatusTest {

	@ParameterizedTest(name = "{0} -> {1}: {2}")
	@MethodSource("transitions")
	fun `네 상태의 16가지 조합 중 허용 목록의 6가지 변경만 할 수 있고 같은 상태로의 변경을 포함한 나머지는 할 수 없다`(
		from: RoomStatus,
		to: RoomStatus,
		allowed: Boolean,
	) {
		assertThat(from.canChangeTo(to)).isEqualTo(allowed)
	}

	companion object {
		private val ALLOWED = setOf(
			RoomStatus.VACANT to RoomStatus.RESERVED,
			RoomStatus.RESERVED to RoomStatus.OCCUPIED,
			RoomStatus.OCCUPIED to RoomStatus.MAINTENANCE,
			RoomStatus.MAINTENANCE to RoomStatus.VACANT,
			RoomStatus.RESERVED to RoomStatus.VACANT,
			RoomStatus.VACANT to RoomStatus.MAINTENANCE,
		)

		@JvmStatic
		fun transitions(): List<Arguments> =
			RoomStatus.entries.flatMap { from -> RoomStatus.entries.map { to -> Arguments.of(from, to, (from to to) in ALLOWED) } }
	}
}
