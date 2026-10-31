package com.marco.assignment.handys.urbanstay.guest.service

import com.marco.assignment.handys.urbanstay.common.exception.BusinessException
import com.marco.assignment.handys.urbanstay.common.exception.violates
import com.marco.assignment.handys.urbanstay.guest.entity.Guest
import com.marco.assignment.handys.urbanstay.guest.exception.GuestErrorCode
import com.marco.assignment.handys.urbanstay.guest.repository.GuestRepository
import com.marco.assignment.handys.urbanstay.guest.repository.GuestSpecifications
import com.marco.assignment.handys.urbanstay.member.entity.Member
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant

@Service
class GuestService(
	private val guestRepository: GuestRepository,
	private val clock: Clock,
) {

	@Transactional
	fun getOrCreate(hotelId: Long, member: Member): Guest {
		val memberId = checkNotNull(member.id)
		val guest = findSamePhone(hotelId, member.phone) ?: run {
			guestRepository.insertIfPhoneAbsent(hotelId, memberId, member.name, member.phone, member.email, Instant.now(clock))
			checkNotNull(findSamePhone(hotelId, member.phone))
		}
		if (guest.member?.id != memberId && guestRepository.linkMember(checkNotNull(guest.id), memberId, Instant.now(clock)) == 0) {
			throw BusinessException(GuestErrorCode.GUEST_LINKED_TO_OTHER_MEMBER)
		}
		return guest
	}

	@Transactional(readOnly = true)
	fun getGuests(hotelId: Long, keyword: String?, page: Int, size: Int): Page<Guest> =
		guestRepository.findAll(GuestSpecifications.search(hotelId, keyword?.trim()?.ifEmpty { null }), PageRequest.of(page, size, NEWEST_FIRST))

	@Transactional(readOnly = true)
	fun getGuest(hotelId: Long, guestId: Long): Guest = findGuest(hotelId, guestId)

	@Transactional
	fun update(hotelId: Long, guestId: Long, version: Long, name: String, phone: String, email: String): Guest {
		val guest = findGuest(hotelId, guestId)
		if (guest.version != version) {
			throw BusinessException(GuestErrorCode.GUEST_MODIFIED)
		}
		checkPhoneNotDuplicated(hotelId, phone, guestId)
		guest.update(name, phone, email)
		return translateConflicts { guestRepository.saveAndFlush(guest) }
	}

	private fun findGuest(hotelId: Long, guestId: Long): Guest =
		guestRepository.findByIdAndHotelId(guestId, hotelId) ?: throw BusinessException(GuestErrorCode.GUEST_NOT_FOUND)

	private fun findSamePhone(hotelId: Long, phone: String): Guest? =
		guestRepository.findOne(GuestSpecifications.samePhone(hotelId, phone, null)).orElse(null)

	private fun checkPhoneNotDuplicated(hotelId: Long, phone: String, guestId: Long?) {
		if (guestRepository.exists(GuestSpecifications.samePhone(hotelId, phone, guestId))) {
			throw BusinessException(GuestErrorCode.GUEST_PHONE_DUPLICATED)
		}
	}

	private fun translateConflicts(save: () -> Guest): Guest =
		try {
			save()
		} catch (e: DataIntegrityViolationException) {
			throw if (e.violates(Guest.HOTEL_PHONE_UNIQUE_CONSTRAINT)) BusinessException(GuestErrorCode.GUEST_PHONE_DUPLICATED) else e
		} catch (e: OptimisticLockingFailureException) {
			throw BusinessException(GuestErrorCode.GUEST_MODIFIED)
		}

	companion object {
		private val NEWEST_FIRST = Sort.by(Sort.Direction.DESC, Guest::id.name)
	}
}
