package com.marco.assignment.handys.urbanstay.account.exception

import com.marco.assignment.handys.urbanstay.common.config.ApiErrors

@ApiErrors
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AccountApiErrors(vararg val value: AccountErrorCode)
