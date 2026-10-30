package com.marco.assignment.handys.urbanstay.common.response

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class SuccessMessage(val key: String)
