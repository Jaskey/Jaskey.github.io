---
layout: post
title: "CSS实现垂直居中"
date: 2015-08-04 16:49:40 +0800
comments: true
categories: css
description: CSS实现垂直居中
keywords: css , position, flex, 绝对定位
---


CSS垂直居中真是一个令人头疼的事，最近遇到了一个较为简单且通用的方法，总结如下：



1.无需要设置自己高度，和父容器高度, 利用绝对定位只需要以下三行：

	parentElement{
		position:relative;
	}
	childElement{
    	position: absolute;
    	top: 50%;
    	transform: translateY(-50%);
	}




2.若只有父容器下只有一个元素，且父元素设置了高度，则只需要使用相对定位即可

	parentElement{
		height:xxx;
	}
	.childElement {
	  position: relative;
	  top: 50%;
	  transform: translateY(-50%);
	}



例子猛击:[DEMO](http://jsfiddle.net/V5uKe/904/ "demo")

----------------------------

##Flex布局##

如果你不需要兼容老式浏览器(例如IE9及以下)，使用Flex布局可以非常轻松实现

浏览器支持如下：
![Flex的支持性](/images/css/flex-support.jpg "flex的支持性")


样式：

	parentElement{
		display:flex;/*Flex布局*/
		display: -webkit-flex; /* Safari */
		align-items:center;/*交叉轴居中，这里由于flex-direction默认是row,即垂直居中*/
	}

注意，设为Flex布局以后，子元素的float、clear和vertical-align属性将失效

例子猛击:[Flex demo](http://codepen.io/anon/pen/PZKZqe "Flex垂直居中Demo")

-------------------------

Flex教程可参考[这里](http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)