---
layout: post
title: "ADB server didn't ACK ,failed to start daemon 解决方法(小心风行客户端)"
date: 2014-10-03 23:40:05 +0800
comments: true
categories: Android
---

最近重新学习Android，但这两天遇到了极为奇怪的问题，突然之间，启动ADT的时候就报出下面的错误：

	[2014-10-03 12:15:43 - adb] ADB server didn't ACK
	[2014-10-03 12:15:43 - adb] * failed to start daemon *
	[2014-10-03 12:15:43 - ddms] 'E:\Programming\ADT\adt-bundle-windows-x86_64-20140702\sdk\platform-tools\adb.exe,start-server' failed -- run manually if necessary


查了一下stackoverflow， 大多数的解决方案都是：

1. 关掉eclipse
2. 在任务管理器中把adb.exe关掉
3. 进入adb所在目录，然后执行adb start-server，成功执行则问题解决

**问题应该就解决了。但我的问题是， adb start-server 启动不起来！**

最后发现了是端口占用的原因导致。

解决方法如下：

1.`adb nodaemon server`

查看不能执行的原因，输出：
> cannot bind 'tcp:5037'

2.定位到了是端口的问题！是5037端口被占用了！

3.`netstat -ano | findstr 5037`

查找谁占用了5037的进程，得到进程pid.

4.杀死该进程。

可以在任务管理器中杀死，或者使用命令：
    taskkill /pid 端口号 -f


最后发现是tfadb.exe这个程序占用了该端口。查询签名发现这是风行客户端！！

真是无比坑爹啊，安装了风行的同学真的要注意下。