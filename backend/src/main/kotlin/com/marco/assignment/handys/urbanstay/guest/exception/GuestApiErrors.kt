package com.marco.assignment.handys.urbanstay.guest.exception

import com.marco.assignment.handys.urbanstay.common.config.ApiErrors

@ApiErrors
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class GuestApiErrors(vararg val value: GuestErrorCode)
