package com.marco.assignment.handys.urbanstay.guest.repository

import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant

interface GuestRepository : JpaRepository<Guest, Long>, JpaSpecificationExecutor<Guest> {

	fun findByIdAndHotelId(id: Long, hotelId: Long): Guest?

	@Modifying
	@Query(
		value = """
		insert into guest (hotel_id, member_id, name, phone, email, version, created_at, updated_at)
		values (:hotelId, :memberId, :name, :phone, :email, 0, :createdAt, :createdAt)
		on conflict (hotel_id, (replace(phone, '-', ''))) do nothing
		""",
		nativeQuery = true,
	)
	fun insertIfPhoneAbsent(hotelId: Long, memberId: Long, name: String, phone: String, email: String, createdAt: Instant): Int

	@Modifying(flushAutomatically = true)
	@Query(
		value = """
		update guest set member_id = :memberId, updated_at = :updatedAt
		where id = :id and (member_id is null or member_id = :memberId)
		""",
		nativeQuery = true,
	)
	fun linkMember(id: Long, memberId: Long, updatedAt: Instant): Int
}
