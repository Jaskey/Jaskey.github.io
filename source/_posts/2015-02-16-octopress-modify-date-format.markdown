---
layout: post
title: "修改octopress的时间格式"
date: 2015-02-16 17:59:19 +0800
comments: true
categories: octopress
---

之前在`_config.yml`中增加了时间格式的设置,但一直没效果:

`date_format: "%F %a"  		#2012-01-01`

后来在StackOverflow上提了一个问题找到了答案：

1. 安装Octopress Date format：

		gem install octopress-date-format

2. 在`_config.yml`中加入：

		gems:
  			- octopress-date-format

3. 配置自定义格式。在`_config.yml`中配置时间的格式。默认的格式是：


    	date_format: 'ordinal' # July 3rd, 2014
    	time_format: '%-I:%M %P'   # 2:08 pm


我们可以改成:
 

		date_format: "%Y-%m-%d"  # e.g. 2014-07-03
		time_format: "%H:%M"     # 24 hour time


最后生成页面，大功告成：
		
		rake generate


更多详情可参看：https://github.com/octopress/date-format#configuration
