---
layout: post
title: "在windows上使用_netrc文件让Git记住用户名和密码"
date: 2014-11-28 16:58:21 +0800
comments: true
categories: Git
---

每次写octopress博客的git push 和 rake deploy 都要问一次用户名密码，真的非常烦。以下是一个简单的方法让git记住用户名和密码：


- 定义一个用户环境变量%HOME%， value=%USERPROFILE%。（windows会把路径自动替换为用户路径）
- 在%HOME%路径下新建一个文件`_netrc`
- 在`_netrc`文件中增加下面的配置：

    machine <hostname1>
    login <login1>
    password <password1>
    machine <hostname2>
    login <login2>
    password <password2>

如： 
    
    machine github.com
	login cnblogs_user
	password cnblogs_pwd