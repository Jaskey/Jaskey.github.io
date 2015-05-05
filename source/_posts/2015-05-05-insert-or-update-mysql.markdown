---
layout: post
title: "Insert Or Update操作，MySQL"
date: 2015-05-05 16:46:59 +0800
comments: true
categories: 数据库
---


如果需要执行操作如：“插入一行记录，若存在，则更新”的操作，在MySQL中，不需要使用Exists也不需要分两次语句执行，可以直接使用如下语句：

     INSERT INTO table1 (user, auth) VALUES ('user1', 1) ON DUPLICATE KEY UPDATE auth = 1;

上面的语句达到的效果是往table1里面插入一条记录，给`user1` `1`的权限，若这条记录已经存在，则更新权限值为1。

注：这语法不是标准SQL语法，所以仅适用于MySQL



