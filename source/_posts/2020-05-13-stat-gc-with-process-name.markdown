---
layout: post
title: "利用Java进程名进行jstat -gc"
date: 2020-05-13 16:29:07 +0800
comments: true
categories: gc java
keywords: 
description: 一段shell脚本利用Java进程名输出gc统计信息
---



需要实时观看GC的情况，我们可以类似如下命令进行监控



```bash
 jstat -gc $pid 100 10 
```



但是这里需要一个进程号，很麻烦，每个Java进程在不同机器或者启动不一样就会不一样，对于自动监控脚本或者是如果需要定位应用刚开始启动时候gc的问题时，当你手动敲完命令拿到pid的时候，可能都凉了。



对此写了一个简单的shell脚本可以传入进程名去执行jstat



gcstat.sh:

```bash
#! /bin/bash

process=$1
interval=$2
count=$3
pid=$(ps -ef | grep java | grep $process | grep -v grep | awk '{print $2}') 
echo $pid
echo $interval
echo $count
```



使用：



```bash
./gcstat.sh  processName 1000 5
```

