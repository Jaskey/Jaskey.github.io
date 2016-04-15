---
layout: post
title: "在IntilliJ中运行Maven的Tomcat项目"
date: 2016-04-15 16:45:28 +0800
comments: true
categories: 
keywords: maven, tomcat, intelliJ, IDEA 
description: 在IntiliJ中运行Maven的Tomcat项目
---


对于一个Maven项目，如果又是一个tomcat项目，在运行tomcat之前应该要进行Maven的构建。

以下是步骤：

1.新建一个Maven Run/Debug configuration:

 ![新建一个Maven Run/Debug configuration](/images/intellij/new_maven_config.jpg "新建一个Maven Run/Debug configuration")


2.在Tomcat Run/Debug Configuration中新增#1的阶段在"Before Launch"中
 
 ![在Tomcat Run/Debug Configuration中新增#1的阶段在"Before Launch"中](/images/intellij/add_maven_build_to_tomcat_config.jpg"在Tomcat Run/Debug Configuration中新增#1的阶段在"Before Launch"中")
