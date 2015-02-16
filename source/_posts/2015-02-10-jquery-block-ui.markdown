---
layout: post
title: "jQuery BlockUI 的使用 "
date: 2015-02-10 12:05:30 +0800
comments: true
categories: jQuery
---

jQuery BlockUI Plugin[(下载链接)](http://malsup.github.io/jquery.blockUI.js "下载链接")  能做到方便得屏蔽整个page或者某些元素。当用于异步请求的时候，尤为有用。

用法也非常简单。以下简单的记录下使用笔记：

1. 使用前，需要先引入jQuery 再引入jQuery blockUI。
2. 当需要全屏block时候,使用API `$.blockUI()`;,unblock使用`$.unblockUI()`
3. 部分的Element block时，使用 `$("选择器").block();`unblock使用`$(选择器).unblock()`即可


需要自定义block的消息或者样式，可以传入一个像下面的一个对象：

				{
                    message: '<h1>Processing</h1>',//显示的消息
                    centerX: false,//当element block时候，注意设置此属性为false,否则位置不生效
                    centerY: false,
                    css: {
                        top: '5%',
                        left: '5%'
						....//其他CSS属性
                    }
                }


关于此对象的更多细节，可以查看：http://malsup.com/jquery/block/#options

各种demo可以查看：http://malsup.com/jquery/block/#demos