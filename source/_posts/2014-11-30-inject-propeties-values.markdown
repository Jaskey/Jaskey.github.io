---
layout: post
title: "从属性文件为变量赋值，Spring"
date: 2014-11-30 03:38:56 +0800
comments: true
categories: Spring
---

有时候，我们需要从一些属性文件为变量赋值，这样修改变量值就不需要修改代码，直接修改属性文件就可以了。这样方便管理和维护。

Spring可以很轻松地通过Annotation的方式注入属性值，以下记录下学习的过程。

##配置##
**1. 新建属性文件**

如`application.properties`

里面的格式为： `name=value`

如：	

	token=wodinow

**2. 配置属性文件路径**

	<context:property-placeholder location="classpath:application.properties" />

----------------------

##使用注解注入##

在一个Bean中， 使用@Value注解使用${name}格式，如在@Controller中 

	@Controller
	public class CoreController {   
	
	    @Value("${developer_id}")
	    private String developerID;
	
	    }

##为静态变量注入##

Spring不能为静态变量注入属性值，但我们可以配置一个setter完成此项工作，如：

	@Component
	public class SignUtil {  
    
		//需要从属性文件中读值的静态变量
	    private static  String TOKEN;  
	
        //配置一个setter, 为该静态变量赋值
		@Value("${token}")
		private void setTOKEN(String token) {
			SignUtil.TOKEN = token;
		}  
    ｝
