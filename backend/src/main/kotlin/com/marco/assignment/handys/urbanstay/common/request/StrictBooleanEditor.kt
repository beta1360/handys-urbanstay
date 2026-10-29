package com.marco.assignment.handys.urbanstay.common.request

import java.beans.PropertyEditorSupport

class StrictBooleanEditor : PropertyEditorSupport() {

	override fun setAsText(text: String?) {
		value = when (text) {
			"true" -> true
			"false" -> false
			else -> throw IllegalArgumentException("Boolean request parameter must be true or false")
		}
	}
}
