---
layout: post
title: "如何在eclipse中修改源目录路径"
date: 2014-10-18 19:37:41 +0800
comments: true
categories: 
---


在我们使用`Maven`或者`Gradle`的时候，源码目录要求是：src/main/java。

但是如果我们直接用已经构建好了的eclipse项目，无论怎么新建文件夹，都不能构建出这样的源目录结构。eclipse会把main.java视为包(package)。

要解决这个问题，我们需要先让eclipse不要把src视为源目录(source folder)。方法：

右键src目录--->build path ---> remove from build path.

这样以后，我们就可以建立我们的main和java文件夹在src下。
然后右键java文件夹--->select build path --> use as source folder， 这样就可以把源目录指向src/main/java了