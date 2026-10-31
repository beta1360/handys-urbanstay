package com.marco.assignment.handys.urbanstay.stay.service

import com.marco.assignment.handys.urbanstay.stay.entity.Stay
import com.marco.assignment.handys.urbanstay.stay.repository.StayRepository
import com.marco.assignment.handys.urbanstay.stay.repository.StaySettlementSummary
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.YearMonth

@Service
class StaySettlementService(
	private val stayRepository: StayRepository,
) {

	@Transactional(readOnly = true)
	fun getSettlement(hotelId: Long, month: YearMonth): StaySettlementSummary =
		stayRepository.summarize(hotelId, month.atDay(1), month.atEndOfMonth())

	@Transactional(readOnly = true)
	fun getSettlementStays(hotelId: Long, month: YearMonth, page: Int, size: Int): Page<Stay> =
		stayRepository.findByRoomHotelIdAndCheckInDateBetween(hotelId, month.atDay(1), month.atEndOfMonth(), PageRequest.of(page, size, EARLIEST_CHECK_IN_FIRST))

	companion object {
		private val EARLIEST_CHECK_IN_FIRST = Sort.by(Sort.Order.asc(Stay::checkInDate.name), Sort.Order.asc(Stay::id.name))
	}
}
