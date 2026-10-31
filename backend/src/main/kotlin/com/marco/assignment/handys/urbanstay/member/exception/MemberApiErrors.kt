package com.marco.assignment.handys.urbanstay.member.exception

import com.marco.assignment.handys.urbanstay.common.config.ApiErrors

@ApiErrors
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class MemberApiErrors(vararg val value: MemberErrorCode)
