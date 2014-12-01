---
layout: post
title: "通过VM参数选择本地log4j配置文件"
date: 2014-11-30 02:32:58 +0800
comments: true
categories: log4j
---

有时候我们项目的log4j配置文件配置的是生产环境，每次本地调试又不想改会本地的调试配置，就可以通过JVM参数去修改此路径。

在项目的参数中加入：

	-Dlog4j.configuration=file:log4j配置文件路径

注：路径需要以file:开头，如：
	
	-Dlog4j.configuration=file:E:\Programming\debug_log4j.properties

即可在本地运行时选择本地的配置文件进行日志配置。