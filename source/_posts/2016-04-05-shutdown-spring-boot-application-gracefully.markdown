---
layout: post
title: "如何优雅地停止运行中的内嵌Tomcat的Spring Boot应用"
date: 2016-04-05 15:15:48 +0800
comments: true
categories: spring 
keywords: spring , spring boot, endpoint, 内嵌tomcat, embedded
description: shutdown spring boot application gracefully, 优雅关闭Spring Boot应用
---


你很可能根据[https://spring.io/guides/gs/rest-service/](https://spring.io/guides/gs/rest-service/ "官方教程")搭起了一个Spring的Rest服务，然后打包成了jar包，不需要容器就可以在生成环境下通过运行jar包启动一个Web服务。

但这样的服务怎么样正确的停止呢？或许你只是简单的`kill -9`对应的进程，但实际上，有更优雅的方式。

Spring Boot里面有一个`spring-boot-starter-actuator`的项目，可以监控和管理Spring Boot应用。其中暴露了很多[endpoint](http://docs.spring.io/spring-boot/docs/1.3.3.RELEASE/reference/htmlsingle/#production-ready-customizing-endpoints "endpoint"),可以方便的检测应用的健康情况。其中有一个`shutdown`的endpoint可以优雅地停止应用。 


<!--more-->

##Maven基本配置##

使用Maven的话，可以用以下方式配置：


###增加依赖###

	<dependency>
	    <groupId>org.springframework.boot</groupId>
	    <artifactId>spring-boot-starter-actuator</artifactId>
	</dependency>

###配置文件配置启用shutdown的HTTP访问###


	#启用 shutdown endpoint的HTTP访问
	endpoints.shutdown.enabled=true
	#不需要用户名密码验证 
	endpoints.shutdown.sensitive=false


###POST请求到shutdown路径###

以上配置完成后，可以使用`curl -X POST localhost:port/shutdown`发动post请求，即可优雅的停止应用：

	curl -X POST localhost:8088/manage/shutdown      
	{"message":"Shutting down, bye..."}


##密码安全配置##

若需要安全验证，则需要以下依赖：

	<dependency>
	  <groupId>org.springframework.boot</groupId>
	  <artifactId>spring-boot-starter-security</artifactId>
	</dependency>

并配置你想要密码验证的endpoint的`sensitive=true`.

	endpoints.shutdown.sensitive=true

在`application.properties文件`配置对应的密码：

	security.user.name=admin
	security.user.password=secret
	management.security.role=SUPERUSER


##路径/端口/ip访问限制##

很可能这种监控你只需要在本机访问（如只有本机才能关闭应用），若需要如此，可以考虑以下管理配置

	##management endpoint的路径，默认为/
	management.context-path=/manage

	##management endpoint的监听端口
	management.port=8081

	##management endpoint只允许来自本机的连接
	management.address=127.0.0.1






------------

参考：
[Spring Boot文档](https://github.com/spring-projects/spring-boot/blob/master/spring-boot-docs/src/main/asciidoc/production-ready-features.adoc#endpoints "spring boot文档")