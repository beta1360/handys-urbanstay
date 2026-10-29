package com.marco.assignment.handys.urbanstay.hotel.exception

import com.marco.assignment.handys.urbanstay.common.config.ApiErrors

@ApiErrors
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class HotelApiErrors(vararg val value: HotelErrorCode)
