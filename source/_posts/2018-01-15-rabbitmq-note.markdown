---
layout: post
title: "RabbitMQ常用命令与配置"
date: 2018-01-15 14:56:56 +0800
comments: true
categories: 
keywords: java rabbbitmq
description: java , rabbbitmq
---

以下记录RabbitMQ常用的运维命令和配置

-----------------------------

# 常用命令

###启动进程：

    sbin/rabbitmq-server -detached

###关闭进程：
    sbin/rabbitmqctl stop
 
 
###创建账号：


    sbin/rabbitmqctl add_user admin ${mq_password}
    sbin/rabbitmqctl set_user_tags admin administrator
    sbin/rabbitmqctl set_permissions -p '/' admin '.*' '.*' '.*'


 
###启动监控：

    #启动监控后，可以用http访问控制台 ip:监控端口（默认原端口+10000）
    sbin/rabbitmq-plugins enable rabbitmq_management
 

###加入集群：

    #要先停止应用
    sbin/rabbitmqctl stop_app
    #加入集群，cluster_name为之前启动的那个集群名称，通常为环境变量文件中配置的RABBITMQ_NODE_IP_ADDRESS
    sbin/rabbitmqctl join_cluster ${cluster_name}
    #再次启动应用    
    sbin/rabbitmqctl start_app


命令文档：https://www.rabbitmq.com/rabbitmqctl.8.html

----------------
#配置文件

rabbitmq-env.conf

	RABBITMQ_NODE_IP_ADDRESS= //IP地址，空串bind所有地址，指定地址bind指定网络接口
	RABBITMQ_NODE_PORT=       //TCP端口号，默认是5672
	RABBITMQ_NODENAME=        //节点名称。默认是rabbit
	RABBITMQ_CONFIG_FILE= //配置文件路径 ，即rabbitmq.config文件路径
	RABBITMQ_MNESIA_BASE=     //mnesia所在路径
	RABBITMQ_LOG_BASE=        //日志所在路径
	RABBITMQ_PLUGINS_DIR=     //插件所在路径

rabbitmq.config

	tcp_listerners    #设置rabbimq的监听端口，默认为[5672]。
	disk_free_limit     #磁盘低水位线，若磁盘容量低于指定值则停止接收数据，默认值为{mem_relative, 1.0},即与内存相关联1：1，也可定制为多少byte.
	vm_memory_high_watermark    #设置内存低水位线，若低于该水位线，则开启流控机制，默认值是0.4，即内存总量的40%。
	hipe_compile     #将部分rabbimq代码用High Performance Erlang compiler编译，可提升性能，该参数是实验性，若出现erlang vm segfaults，应关掉。
	force_fine_statistics    #该参数属于rabbimq_management，若为true则进行精细化的统计，但会影响性能。
	frame_max     #包大小，若包小则低延迟，若包则高吞吐，默认是131072=128K。
	heartbeat     #客户端与服务端心跳间隔，设置为0则关闭心跳，默认是600秒。



#一台机器启动多个实例

以上如果希望一个机器中启动多个实例，简单需要配置的地方仅有

rabbitmq-env.conf：

    #改个名字
    RABBITMQ_NODENAME=your_new_node_name
	#改个端口    
    RABBITMQ_NODE_PORT=5673


rabbitmq.config:
   
    %tcp 监听端口对应修改%
    {tcp_listeners, [5673]},


rabbitmq_management下面的监听端口对应修改，建议原端口加10000保持与原来默认的统一
    
    {listener, [{port,     15673}]}







文档：http://www.rabbitmq.com/configure.html#configuration-file
