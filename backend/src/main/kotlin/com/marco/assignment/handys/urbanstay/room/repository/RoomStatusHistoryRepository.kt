package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.room.entity.RoomStatusHistory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface RoomStatusHistoryRepository : JpaRepository<RoomStatusHistory, Long> {

	fun findByRoomId(roomId: Long, pageable: Pageable): Page<RoomStatusHistory>
}
