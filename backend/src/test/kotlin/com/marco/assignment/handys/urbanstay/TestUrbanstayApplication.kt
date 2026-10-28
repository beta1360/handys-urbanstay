package com.marco.assignment.handys.urbanstay

import org.springframework.boot.fromApplication
import org.springframework.boot.with


fun main(args: Array<String>) {
	fromApplication<UrbanstayApplication>().with(TestcontainersConfiguration::class).run(*args)
}
