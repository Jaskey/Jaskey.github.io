---
layout: post
title: "怎么在Spring Controller里面返回404"
date: 2014-09-27 18:02:48 +0800
comments: true
categories: Spring
---

由于大多的客户端和服务端是独立的（可能用不同语言编写），客户端无法获知服务端的异常，所以普通的异常处理并不足以提示客户端。而基于HTTP协议的服务，我们则需要按照服务端的异常而返回特定的状态码给客户端。

以返回404状态码为例，在Spring 的Controller里面我们可以有以下3种方式处理：

1. ## 自定义异常+@ResponseStatus注解： ##

		//定义一个自定义异常，抛出时返回状态码404
		@ResponseStatus(value = HttpStatus.NOT_FOUND)
		public class ResourceNotFoundException extends RuntimeException {
		    ...
		}
		
		//在Controller里面直接抛出这个异常
		@Controller
		public class SomeController {
		    @RequestMapping(value="/video/{id}",method=RequestMethod.GET)
			public @ResponseBody Video getVidoeById(@PathVariable long id){
		    	if (isFound()) {
		            // 做该做的逻辑
		        }
		        else {
		            throw new ResourceNotFoundException();//把这个异常抛出 
		        }
		    }
		}


2. ## 使用Spring的内置异常 ##
默认情况下，Spring 的`DispatcherServlet `注册了`DefaultHandlerExceptionResolver`,这个resolver会处理标准的Spring MVC异常来表示特定的状态码

		Exception									HTTP Status Code
		ConversionNotSupportedException				500 (Internal Server Error)
		HttpMediaTypeNotAcceptableException			406 (Not Acceptable)
		HttpMediaTypeNotSupportedException			415 (Unsupported Media Type)
		HttpMessageNotReadableException				400 (Bad Request)
		HttpMessageNotWritableException				500 (Internal Server Error)
		HttpRequestMethodNotSupportedException		405 (Method Not Allowed)
		MissingServletRequestParameterException		400 (Bad Request)
		NoSuchRequestHandlingMethodException		404 (Not Found)
		TypeMismatchException						400 (Bad Request)


3. ## 在Controller方法中通过HttpServletResponse参数直接设值	 ##
		//任何一个RequestMapping 的函数都可以接受一个HttpServletResponse类型的参数
		@Controller
		public class SomeController {
		    @RequestMapping(value="/video/{id}",method=RequestMethod.GET)
			public @ResponseBody Video getVidoeById(@PathVariable long id ,HttpServletResponse response){
		    	if (isFound()) {
		            // 做该做的逻辑
		        }
		        else {
		            response.setStatus(HttpServletResponse.SC_NOT_FOUND);//设置状态码
		        }
				return ....
		    }
		}
 	


更多详情：
[Spring MVC 文档](http://docs.spring.io/spring/docs/3.1.x/spring-framework-reference/html/mvc.html#mvc-exceptionhandlers "spring doc")
		