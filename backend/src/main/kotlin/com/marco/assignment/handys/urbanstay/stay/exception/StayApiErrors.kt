package com.marco.assignment.handys.urbanstay.stay.exception

import com.marco.assignment.handys.urbanstay.common.config.ApiErrors

@ApiErrors
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class StayApiErrors(vararg val value: StayErrorCode)
