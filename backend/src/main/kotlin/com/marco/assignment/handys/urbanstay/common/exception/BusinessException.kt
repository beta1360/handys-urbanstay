package com.marco.assignment.handys.urbanstay.common.exception

class BusinessException(val errorCode: ErrorCode) : RuntimeException(errorCode.code)
