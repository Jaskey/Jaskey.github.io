---
layout: post
title: "Octopress 博文中引入javascript文件/HTML文件"
date: 2015-07-30 12:18:28 +0800
comments: true
categories: JSON Java
---

`.markdown`文件中是可以引入javascript甚至是html文件的，这样以后博文里面插入代码运行结果写demo就很方便了。

以下是具体方法，并带一个例子


##引入Javascript##
语法：

	<script type="text/javascript" src="/path/to/file.js"></script>


例如： 在 source 中的404.markdown 中 加入：

	<script type="text/javascript" src="http://www.qq.com/404/search_children.js" charset="utf-8></script>

即可在404页面中跳转到腾讯的公益页面

##引入HTML文件

以下为引入后的样本实例：

{% include demo/include_HTML_demo.html %}




注：由于octopress已经引入了jQuery,故本页面无须额外引入jQuery.