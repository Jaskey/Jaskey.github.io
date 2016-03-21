---
layout: post
title: "通过VM参数指定本地log4j配置文件,Spring Boot"
date: 2016-03-21 19:20:09 +0800
comments: true
categories: spring log4j
description: 通过VM参数指定本地log4j配置文件,Spring Boot
keywords: log4j , Spring, Spring-Boot, log4j.properties
---

`Spring Boot`有预设的日志配置逻辑（具体参看：[这里](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-logging.html#boot-features-custom-log-configuration)）, 如果是log4j的话，以下文件会被加载：

`log4j-spring.properties`, `log4j-spring.xml`, `log4j.properties` , `log4j.xml`


有时候我们项目的log4j配置文件配置的是生产环境，每次本地调试又不想改会本地的调试配置，若希望通过VM参数去修改此文件，按照之前的参数`-Dlog4j.configuration`(非Spring Boot项目请看这里[通过VM参数选择本地log4j配置文件](http://jaskey.github.io/blog/2014/11/30/log4j-configuration-via-jvm-argument/))，在Spring Boot的项目中并不生效。

若需要指定另外的文件，需要用Spring Boot指定的配置：`-Dlogging.config`如

	-Dlogging.config=D:\project\git_repo\prome-data\src\main\resources\log4j-debug.properties
	

即可在本地运行时选择本地的配置文件进行日志配置。
