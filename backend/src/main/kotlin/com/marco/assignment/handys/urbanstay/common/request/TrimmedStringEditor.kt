package com.marco.assignment.handys.urbanstay.common.request

import java.beans.PropertyEditorSupport

class TrimmedStringEditor : PropertyEditorSupport() {

	override fun setAsText(text: String?) {
		value = text?.trim()?.ifEmpty { null }
	}
}
