package com.marco.assignment.handys.urbanstay.common.request

import org.springframework.web.bind.WebDataBinder
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.InitBinder

@ControllerAdvice
class RequestParameterBindingAdvice {

	@InitBinder
	fun registerStrictBooleanEditor(binder: WebDataBinder) {
		binder.registerCustomEditor(Boolean::class.javaObjectType, StrictBooleanEditor())
		binder.registerCustomEditor(Boolean::class.java, StrictBooleanEditor())
	}
}
