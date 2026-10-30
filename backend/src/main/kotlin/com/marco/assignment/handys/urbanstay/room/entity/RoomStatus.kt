package com.marco.assignment.handys.urbanstay.room.entity

enum class RoomStatus {
	VACANT,
	RESERVED,
	OCCUPIED,
	MAINTENANCE,
	;

	fun canChangeTo(next: RoomStatus): Boolean =
		when (this) {
			VACANT -> next == RESERVED || next == MAINTENANCE
			RESERVED -> next == OCCUPIED || next == VACANT
			OCCUPIED -> next == MAINTENANCE
			MAINTENANCE -> next == VACANT
		}
}
