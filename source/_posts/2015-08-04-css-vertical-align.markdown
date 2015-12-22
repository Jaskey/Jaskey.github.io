---
layout: post
title: "三行CSS实现垂直居中"
date: 2015-08-04 16:49:40 +0800
comments: true
categories: css
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