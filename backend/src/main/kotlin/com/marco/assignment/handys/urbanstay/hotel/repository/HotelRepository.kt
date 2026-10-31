package com.marco.assignment.handys.urbanstay.hotel.repository

import com.marco.assignment.handys.urbanstay.hotel.entity.Hotel
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query

interface HotelRepository : JpaRepository<Hotel, Long>, JpaSpecificationExecutor<Hotel> {

	fun existsByNameAndAddress(name: String, address: String): Boolean

	fun existsByNameAndAddressAndIdNot(name: String, address: String, id: Long): Boolean

	@Query(
		value = """
		select new com.marco.assignment.handys.urbanstay.hotel.repository.HotelRoomCount(h, count(r))
		from Hotel h left join Room r on r.hotel = h
		group by h
		order by case when count(r) > 0 then 0 else 1 end, h.name, h.id
		""",
		countQuery = "select count(h) from Hotel h",
	)
	fun findAllWithRoomCountOrderByRoomPresenceAndName(pageable: Pageable): Page<HotelRoomCount>
}
