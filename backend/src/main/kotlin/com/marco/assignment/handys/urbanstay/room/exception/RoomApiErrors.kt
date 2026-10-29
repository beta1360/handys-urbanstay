package com.marco.assignment.handys.urbanstay.room.exception

import com.marco.assignment.handys.urbanstay.common.config.ApiErrors

@ApiErrors
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class RoomApiErrors(vararg val value: RoomErrorCode)
