package com.marco.assignment.handys.urbanstay.room.repository

import com.marco.assignment.handys.urbanstay.room.entity.RoomType
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository

interface RoomTypeRepository : JpaRepository<RoomType, Long> {

	fun existsByHotelIdAndName(hotelId: Long, name: String): Boolean

	fun existsByHotelIdAndNameAndIdNot(hotelId: Long, name: String, id: Long): Boolean

	fun findByIdAndHotelId(id: Long, hotelId: Long): RoomType?

	fun findByHotelId(hotelId: Long, sort: Sort): List<RoomType>
}
