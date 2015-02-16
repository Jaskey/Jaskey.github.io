---
layout: post
title: "JavaScript中返回函数"
date: 2015-02-02 18:20:05 +0800
comments: true
categories: JavaScript
---

最近学习JavaScript,遇到了函数闭包的相关问题，由于这是Java没有的概念，认知上容易糊涂。到底 
	
	function a(){
		function b(){
			alert('b');
		  } 
			return b;//没有括号
	} 

和  

	function a(){
		function b(){
			alert('b');
		}
			return b();//多一个括号
	}

有何区别呢？ 在Java中，我们是不能返回一个函数的，也不能为一个对象的属性赋值为函数，但这在Javascript中都可以。以上两种的函数都是正确的，但却表达着完全一样的意义。

第一种方式返回时候不带括号，return函数的名称时，**返回的其实是一个函数b的引用**，即`function a` 返回的结果是`function b`的引用。

而第二种方式带着括号，其实是返回b的执行结果。而b本身不返回东西，所以`return undefined`。

请观察以下几个demo：

	function a() {
	    alert('A');
	}
	//alerts 'A', returns undefined
	
	function b() {
	    alert('B');
	    return a;
	}
	//alerts 'B', returns function a
	
	function c() {
	    alert('C');
	    return a();
	}
	//alerts 'C', alerts 'A', returns undefined
	
	alert("Function 'a' returns " + a());
	alert("Function 'b' returns " + b());//特别留意这里，b()返回的是整一个函数。
	alert("Function 'c' returns " + c());//这里是返回a()的结果，所以会先alert('A'),再返回underfined



加上参数以便更加理解这一例子：

	function a(who) {
	    alert('a say hello to '+ who);
	}
	//alerts 'A', returns undefined
	
	function b(who) {
	    alert('b say hello to '+ who);
	    return a;
	}
	//alerts 'B', returns function a
	
	function c(who) {
	    alert('c say hello to '+ who);
	    return a(who);
	}
	//alerts 'C', alerts 'A', returns undefined
	
	alert("Function 'a' returns " + a("junjie"));//return undefined
	alert("Function 'b' returns " + b("junjie"));//返回整个函数a的定义
	alert("Function 'c' returns " + c('junjie'));//先调用了a(who)，所以alert 了"a say hello to junjie"，再返回undefined，因为a本身不返回值


