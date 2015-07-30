---
layout: post
title: "Octopress 博文中引入javascript文件/HTML文件"
date: 2015-07-30 12:18:28 +0800
comments: true
categories: JSON Java
---



##引入Javascript##
语法：

	<script type="text/javascript" src="/path/to/file.js"></script>


例如： 在 source 中的404.markdown 中 加入：

	<script type="text/javascript" src="http://www.qq.com/404/search_children.js" charset="utf-8></script>

即可在404页面中跳转到腾讯的公益页面

##引入HTML文件
语法：

	{% include demo/include_HTML_demo.html %}


以下为引入后的样本实例：

{% include demo/include_HTML_demo.html %}



## `include_HTML_demo.html` 代码 ##

	<div id="myelement">
		Here is a demo, to demostrate how to include a custom HTML into an octopress blog page.
	
		Try Clicking me.
	
	</div>
	
	<script>
		$('div#myelement').on('click',function(e){
			alert("你刚刚点击了#myelement区域，onClick事件触发了。");
		})
	</script>


注：由于octopress已经引入了jQuery,故本页面无须额外引入jQuery.