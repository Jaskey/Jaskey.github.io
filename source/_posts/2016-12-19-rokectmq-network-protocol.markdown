---
layout: post
title: "RokectMQ——通信协议"
date: 2016-12-19 20:49:23 +0800
comments: true
categories: java rocketmq
keywords: java , rocketmq, broker, nameserver, filterserver, netty
description: 
---

RocketMQ的通信协议其实很简单，但是无论是官方的用户手册，还是网上的博客，并没有很清晰简单地把其中所有的内容和原理讲明白。 对于需要扩展其他语言SDK的开发来说，意味着必须要深入到Java源码才能弄懂其概念。笔者通过深入源码，本文希望以尽量简短的语言描述清楚协议的每个字段及其意义。

无论是发送消息，拉取消息，还是发送心跳等所有的网络通讯层协议（客户端与broker/nameserver间，broker与nameserver间）都使用一套一样的协议。并且无论请求还是响应，协议是一样的，协议头的字段也是固定的。


## 通讯协议
协议分为以下四部分：

![RocketMQ协议](/images/rocketmq/protocol.png "RocketMQ协议")

其中后两部分是通讯的实际数据。前两段都是四个字节的整形，分别表示两段实际数据的长度。

- header: 协议的头，数据是序列化后的json。json的每个key字段都是固定的，不同的通讯请求字段不一样。后面解释

- body: 请求的二进制实际数据。例如发送消息的网络请求中，body中传输实际的消息内容。 

- length:2 3 4 端整体的长度。四个字节整数。

- header length: header的长度。四个字节整数。



### Header

协议header具体标识整个通讯请求的元数据，如请求什么，怎样的方式请求（异步/oneway）请求客户端的版本，语言，请求的具体参数等。

header是序列化的json,以下是json中的所有字段,并阐述起在请求和响应两个阶段的区别。

| 字段      | 类型                   | Request                                                                                                                          | Response                                                                                   |   |
|-----------|------------------------|----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|---|
| code      | 整数                   | 请求操作码。响应方通过code决定如何处理请求。                                                                                       | 响应码。0表示成功，非0表示错误码。                                                         |   |
| language  | 字符串                 | 标记请求方的语言类型，如JAVA。                                                                                                   | 应答方方的所使用的语言。                                                                   |   |
| version   | 整数                   | 请求方的版本号                                                                                                                   | 应答方的版本号                                                                             |   |
| opaque    | 整数                   | 在同一个连接上，标记是哪次请求。服务响应的时候会返回这个请求标识码，以达到请求方多线程中复用连接，在收到响应的时候找到对应的请求 | 原请求的opaque。应答方不做修改原值返回。                                                   |   |
| flag      | 整数                   | 通信层的标识位。标识这次通信的类型。                                                                                             | 通信层的标识位。标识这次通信的类型。                                                       |   |
| remark    | 字符串                 | 传输的自定义文本                                                                                                                 | 应答的文本信息。通常存放错误信息。                                                         |   |
| extFields | HashMap<String,String> | 请求自定义字段。不同的请求会有不一样的参数列表，这里存放那些请求自定义的参数列表。                                               | 响应自定义字段。不同的响应会有不一样的参数列表，若有，这里则存放那些请求自定义的参数列表。 |   |



#### Header详解：

##### code: 

请求/响应码。所有的请求码参考代码`RequestCode.java`。响应码则在`ResponseCode.java`中。

#####language: 

由于要支持多语言，所以这一字段可以给通信双方知道对方通信层锁使用的开发语言。

#####version: 

给通信层知道对方的版本号，响应方可以以此做兼容老版本等的特殊操作。

#####opaque: 

请求标识码。在Java版的通信层中，这个只是一个不断自增的整形，为了收到应答方响应的的时候找到对应的请求。

flag： 按位(bit)解释。

第0位标识是这次通信是request还是response，0标识request, 1 标识response。

第1位标识是否是oneway请求，1标识oneway。应答方在处理oneway请求的时候，不会做出响应，请求方也无序等待应答方响应。

#####remark: 

附带的文本信息。常见的如存放一些broker/nameserver返回的一些异常信息，方便开发人员定位问题。

#####extFields： 

这个字段不通的请求/响应不一样，完全自定义。数据结构上是java的hashmap。在Java的每个RemotingCammand中，其实都带有一个CommandCustomHeader的属性成员，可以认为他是一个强类型的extFields，再最后传输的时候，这个CommandCustomHeader会被忽略，而传输前会把其中的所有字段全部都原封不动塞到extFields中，以作传输。


以发送消息为例(code=310)，发送消息的自定义header是SendMessageRequestHeaderV2（只是字段名对比SendMessageRequestHeader压缩了）。有以下字段：

    @CFNotNull
    private String a;// producerGroup;
    @CFNotNull
    private String b;// topic;
    @CFNotNull
    private String c;// defaultTopic;
    @CFNotNull
    private Integer d;// defaultTopicQueueNums;
    @CFNotNull
    private Integer e;// queueId;
    @CFNotNull
    private Integer f;// sysFlag;
    @CFNotNull
    private Long g;// bornTimestamp;
    @CFNotNull
    private Integer h;// flag;
    @CFNullable
    private String i;// properties;
    @CFNullable
    private Integer j;// reconsumeTimes;
    @CFNullable
    private boolean k;// unitMode = false;


这些字段都会原封不动的去到extFields中做传输，最后看到的发送消息的请求header会类似如：

	{  
   		"code":310,
   		"extFields":{  
      		"f":"0",
      		"g":"1482158310125",
      		"d":"4",
      		"e":"0",
      		"b":"TopicTest",
      		"c":"TBW102",
      		"a":"please_rename_unique_group_name",
      		"j":"0",
      		"k":"false",
      		"h":"0",
      		"i":"TAGS\u0001TagA\u0002WAIT\u0001true\u0002"
   		},
   		"flag":0,
   		"language":"JAVA",
   		"opaque":206,
   		"version":79
	}

注：其中fastjson把值为null的remark过滤了。


##请求码列表

以下是截至到3.2.6的所有请求码列表

```

    // Broker 发送消息
    public static final int SEND_MESSAGE = 10;
    // Broker 订阅消息
    public static final int PULL_MESSAGE = 11;
    // Broker 查询消息
    public static final int QUERY_MESSAGE = 12;
    // Broker 查询Broker Offset
    public static final int QUERY_BROKER_OFFSET = 13;
    // Broker 查询Consumer Offset
    public static final int QUERY_CONSUMER_OFFSET = 14;
    // Broker 更新Consumer Offset
    public static final int UPDATE_CONSUMER_OFFSET = 15;
    // Broker 更新或者增加一个Topic
    public static final int UPDATE_AND_CREATE_TOPIC = 17;
    // Broker 获取所有Topic的配置（Slave和Namesrv都会向Master请求此配置）
    public static final int GET_ALL_TOPIC_CONFIG = 21;
    // Broker 获取所有Topic配置（Slave和Namesrv都会向Master请求此配置）
    public static final int GET_TOPIC_CONFIG_LIST = 22;
    // Broker 获取所有Topic名称列表
    public static final int GET_TOPIC_NAME_LIST = 23;
    // Broker 更新Broker上的配置
    public static final int UPDATE_BROKER_CONFIG = 25;
    // Broker 获取Broker上的配置
    public static final int GET_BROKER_CONFIG = 26;
    // Broker 触发Broker删除文件
    public static final int TRIGGER_DELETE_FILES = 27;
    // Broker 获取Broker运行时信息
    public static final int GET_BROKER_RUNTIME_INFO = 28;
    // Broker 根据时间查询队列的Offset
    public static final int SEARCH_OFFSET_BY_TIMESTAMP = 29;
    // Broker 查询队列最大Offset
    public static final int GET_MAX_OFFSET = 30;
    // Broker 查询队列最小Offset
    public static final int GET_MIN_OFFSET = 31;
    // Broker 查询队列最早消息对应时间
    public static final int GET_EARLIEST_MSG_STORETIME = 32;
    // Broker 根据消息ID来查询消息
    public static final int VIEW_MESSAGE_BY_ID = 33;
    // Broker Client向Client发送心跳，并注册自身
    public static final int HEART_BEAT = 34;
    // Broker Client注销
    public static final int UNREGISTER_CLIENT = 35;
    // Broker Consumer将处理不了的消息发回服务器
    public static final int CONSUMER_SEND_MSG_BACK = 36;
    // Broker Commit或者Rollback事务
    public static final int END_TRANSACTION = 37;
    // Broker 获取ConsumerId列表通过GroupName
    public static final int GET_CONSUMER_LIST_BY_GROUP = 38;
    // Broker 主动向Producer回查事务状态
    public static final int CHECK_TRANSACTION_STATE = 39;
    // Broker Broker通知Consumer列表变化
    public static final int NOTIFY_CONSUMER_IDS_CHANGED = 40;
    // Broker Consumer向Master锁定队列
    public static final int LOCK_BATCH_MQ = 41;
    // Broker Consumer向Master解锁队列
    public static final int UNLOCK_BATCH_MQ = 42;
    // Broker 获取所有Consumer Offset
    public static final int GET_ALL_CONSUMER_OFFSET = 43;
    // Broker 获取所有定时进度
    public static final int GET_ALL_DELAY_OFFSET = 45;
    // Namesrv 向Namesrv追加KV配置
    public static final int PUT_KV_CONFIG = 100;
    // Namesrv 从Namesrv获取KV配置
    public static final int GET_KV_CONFIG = 101;
    // Namesrv 从Namesrv获取KV配置
    public static final int DELETE_KV_CONFIG = 102;
    // Namesrv 注册一个Broker，数据都是持久化的，如果存在则覆盖配置
    public static final int REGISTER_BROKER = 103;
    // Namesrv 卸载一个Broker，数据都是持久化的
    public static final int UNREGISTER_BROKER = 104;
    // Namesrv 根据Topic获取Broker Name、队列数(包含读队列与写队列)
    public static final int GET_ROUTEINTO_BY_TOPIC = 105;
    // Namesrv 获取注册到Name Server的所有Broker集群信息
    public static final int GET_BROKER_CLUSTER_INFO = 106;
    public static final int UPDATE_AND_CREATE_SUBSCRIPTIONGROUP = 200;
    public static final int GET_ALL_SUBSCRIPTIONGROUP_CONFIG = 201;
    public static final int GET_TOPIC_STATS_INFO = 202;
    public static final int GET_CONSUMER_CONNECTION_LIST = 203;
    public static final int GET_PRODUCER_CONNECTION_LIST = 204;
    public static final int WIPE_WRITE_PERM_OF_BROKER = 205;

    // 从Name Server获取完整Topic列表
    public static final int GET_ALL_TOPIC_LIST_FROM_NAMESERVER = 206;
    // 从Broker删除订阅组
    public static final int DELETE_SUBSCRIPTIONGROUP = 207;
    // 从Broker获取消费状态（进度）
    public static final int GET_CONSUME_STATS = 208;
    // Suspend Consumer消费过程
    public static final int SUSPEND_CONSUMER = 209;
    // Resume Consumer消费过程
    public static final int RESUME_CONSUMER = 210;
    // 重置Consumer Offset
    public static final int RESET_CONSUMER_OFFSET_IN_CONSUMER = 211;
    // 重置Consumer Offset
    public static final int RESET_CONSUMER_OFFSET_IN_BROKER = 212;
    // 调整Consumer线程池数量
    public static final int ADJUST_CONSUMER_THREAD_POOL = 213;
    // 查询消息被哪些消费组消费
    public static final int WHO_CONSUME_THE_MESSAGE = 214;

    // 从Broker删除Topic配置
    public static final int DELETE_TOPIC_IN_BROKER = 215;
    // 从Namesrv删除Topic配置
    public static final int DELETE_TOPIC_IN_NAMESRV = 216;
    // Namesrv 通过 project 获取所有的 server ip 信息
    public static final int GET_KV_CONFIG_BY_VALUE = 217;
    // Namesrv 删除指定 project group 下的所有 server ip 信息
    public static final int DELETE_KV_CONFIG_BY_VALUE = 218;
    // 通过NameSpace获取所有的KV List
    public static final int GET_KVLIST_BY_NAMESPACE = 219;

    // offset 重置
    public static final int RESET_CONSUMER_CLIENT_OFFSET = 220;
    // 客户端订阅消息
    public static final int GET_CONSUMER_STATUS_FROM_CLIENT = 221;
    // 通知 broker 调用 offset 重置处理
    public static final int INVOKE_BROKER_TO_RESET_OFFSET = 222;
    // 通知 broker 调用客户端订阅消息处理
    public static final int INVOKE_BROKER_TO_GET_CONSUMER_STATUS = 223;

    // Broker 查询topic被谁消费
    // 2014-03-21 Add By shijia
    public static final int QUERY_TOPIC_CONSUME_BY_WHO = 300;

    // 获取指定集群下的所有 topic
    // 2014-03-26
    public static final int GET_TOPICS_BY_CLUSTER = 224;

    // 向Broker注册Filter Server
    // 2014-04-06 Add By shijia
    public static final int REGISTER_FILTER_SERVER = 301;
    // 向Filter Server注册Class
    // 2014-04-06 Add By shijia
    public static final int REGISTER_MESSAGE_FILTER_CLASS = 302;
    // 根据 topic 和 group 获取消息的时间跨度
    public static final int QUERY_CONSUME_TIME_SPAN = 303;
    // 获取所有系统内置 Topic 列表
    public static final int GET_SYSTEM_TOPIC_LIST_FROM_NS = 304;
    public static final int GET_SYSTEM_TOPIC_LIST_FROM_BROKER = 305;

    // 清理失效队列
    public static final int CLEAN_EXPIRED_CONSUMEQUEUE = 306;

    // 通过Broker查询Consumer内存数据
    // 2014-07-19 Add By shijia
    public static final int GET_CONSUMER_RUNNING_INFO = 307;

    // 查找被修正 offset (转发组件）
    public static final int QUERY_CORRECTION_OFFSET = 308;

    // 通过Broker直接向某个Consumer发送一条消息，并立刻消费，返回结果给broker，再返回给调用方
    // 2014-08-11 Add By shijia
    public static final int CONSUME_MESSAGE_DIRECTLY = 309;

    // Broker 发送消息，优化网络数据包
    public static final int SEND_MESSAGE_V2 = 310;

    // 单元化相关 topic
    public static final int GET_UNIT_TOPIC_LIST = 311;
    // 获取含有单元化订阅组的 Topic 列表
    public static final int GET_HAS_UNIT_SUB_TOPIC_LIST = 312;
    // 获取含有单元化订阅组的非单元化 Topic 列表
    public static final int GET_HAS_UNIT_SUB_UNUNIT_TOPIC_LIST = 313;
    // 克隆某一个组的消费进度到新的组
    public static final int CLONE_GROUP_OFFSET = 314;

    // 查看Broker上的各种统计信息
    public static final int VIEW_BROKER_STATS_DATA = 315;

```