package com.marco.assignment.handys.urbanstay.common.exception

import com.marco.assignment.handys.urbanstay.account.exception.AccountErrorCode
import com.marco.assignment.handys.urbanstay.guest.exception.GuestErrorCode
import com.marco.assignment.handys.urbanstay.hotel.exception.HotelErrorCode
import com.marco.assignment.handys.urbanstay.room.exception.RoomErrorCode
import com.marco.assignment.handys.urbanstay.stay.exception.StayErrorCode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.autoconfigure.AutoConfigurations
import org.springframework.boot.autoconfigure.context.MessageSourceAutoConfiguration
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import org.springframework.context.MessageSource
import java.util.Locale

class ErrorCodeMessageTest {

	private val errorCodes: List<ErrorCode> = listOf<List<ErrorCode>>(
		CommonErrorCode.entries,
		AccountErrorCode.entries,
		HotelErrorCode.entries,
		RoomErrorCode.entries,
		GuestErrorCode.entries,
		StayErrorCode.entries,
	).flatten()

	@Test
	fun `모든 ErrorCode는 messages_properties에 메시지가 있다`() {
		ApplicationContextRunner()
			.withConfiguration(AutoConfigurations.of(MessageSourceAutoConfiguration::class.java))
			.run { context ->
				val messageSource = context.getBean(MessageSource::class.java)
				val missingKeys = errorCodes
					.map { it.messageKey }
					.filter { messageSource.getMessage(it, null, null, Locale.KOREAN) == null }
				assertThat(missingKeys).isEmpty()
			}
	}
}
