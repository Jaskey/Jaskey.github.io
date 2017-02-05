---
layout: post
title: "RocketMQ——组件"
date: 2016-12-14 20:54:20 +0800
comments: true
categories: java rocketmq
keywords: 
description: java , rocketmq, broker, nameserver, filterserver
---




![rocketmq部署](/images/rocketmq/cluster.png "RocketMQ部署")


RocketMQ服务端的组件有三个，NameServer，Broker，FilterServer（可选，部署于和Broker同一台机器）

下面分别介绍三个组件：


# Name Server #

Name Server是RocketMQ的寻址服务。用于把Broker的路由信息做聚合。用户端依靠Name Server决定去获取对应topic的路由信息，从而决定对哪些Broker做连接。

- Name Server是一个几乎无状态的结点，Name Server之间采取share-nothing的设计，互不通信。

- 对于一个Name Server集群列表，客户端连接Name Server的时候，只会选择随机连接一个结点，以做到负载均衡。

- Name Server所有状态都从Broker上报而来，本身不存储任何状态，所有数据均在内存。

- 如果中途所有Name Server全都挂了，影响到路由信息的更新，不会影响和Broker的通信。


# Broker #

Broker是处理消息存储，转发等处理的服务器。

- Broker以group分开，每个group只允许一个master，若干个slave。
- 只有master才能进行写入操作，slave不允许。
- slave从master中同步数据。同步策略取决于master的配置，可以采用同步双写，异步复制两种。
- 客户端消费可以从master和slave消费。在默认情况下，消费者都从master消费，在master挂后，客户端由于从Name Server中感知到Broker挂机，就会从slave消费。
- Broker向所有的NameServer结点建立长连接，注册Topic信息。
 

# Filter Server（可选）#

RocketMQ可以允许消费者上传一个Java类给Filter Server进行过滤。

- Filter Server只能起在Broker所在的机器
- 可以有若干个Filter Server进程
- 拉取消息的时候，消息先经过Filter Server，Filter Server靠上传的Java类过滤消息后才推给Consumer消费。
- 客户端完全可以消费消息的时候做过滤，不需要Filter Server
- FilterServer存在的目的是用Broker的CPU资源换取网卡资源。因为Broker的瓶颈往往在网卡，而且CPU资源很闲。在客户端过滤会导致无需使用的消息在占用网卡资源。
- 使用 Java class上传作为过滤表达式是一个双刃剑——一方面方便了应用的过滤操作且节省网卡资源，另一方面也带来了服务器端的安全风险。这就需要应用来保证过滤代码安全——例如在过滤程序里尽可能不做申请大内存，创建线程等操作。避免 Broker 服务器资源泄漏。


 