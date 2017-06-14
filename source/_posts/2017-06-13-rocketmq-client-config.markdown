---
layout: post
title: "RocketMQ 客户端配置"
date: 2017-06-13 14:56:56 +0800
comments: true
categories: 
keywords: java rocketmq
description: java , rocketmq, broker, nameserver, filterserver, netty
---

RocketMQ的客户端和服务端采取完全不一样的配置机制，客户端没有配置文件，所有的配置选项需要开发者使用对应的配置的setter进行设置。

注： 以下带 * 的，表示为重要参数。

-----------------------------

# ClientConfig

RocketMQ的Producer（`DefaultMQProducer`）和Consumer(`DefaultMQPushConsumer`，`DefaultMQPullConsumer`)，甚至运维相关的的admin类（`DefaultMQAdminExt`）都继承自ClientConfig。这意味着，其中的配置无论Producer还是Consumer都可以进行设置，其中大部分都是公用的配置（但由于设计的问题，有些配置只会对消费或生产生效）。

### namesrvAddr*

| 配置说明 | 默认值 |
| ------| ------ | 
|NameServer的地址列表，若是集群，用`;`作为地址的分隔符。 |-D系统参数`rocketmq.namesrv.addr`或环境变量`NAMESRV_ADDR` | 


无论生产者还是消费者，只要是客户端需要和服务器broker进行操作，就需要依赖Name Server进行服务发现。具体请看：[RocketMQ——组件](http://jaskey.github.io/blog/2016/12/14/rocketmq-component/ "RocketMQ——组件")


### instanceName*

| 配置说明 | 默认值 |
| ------| ------ | 
|NameServer的地址列表，若是集群，用`;`作为地址的分隔符。 |从-D系统参数`rocketmq.client.name`获取，否则就是`DEFAULT`| 

这个值虽然默认写是`DEFAULT`，但在启动的时候，如果我们没有显示修改还是维持其`DEFAULT`的话，RocketMQ会更新为当前的进程号：



    public void changeInstanceNameToPID() {
        if (this.instanceName.equals("DEFAULT")) {
            this.instanceName = String.valueOf(UtilAll.getPid());
        }
    }


RocketMQ用一个叫**ClientID**的概念，来唯一标记一个客户端实例，一个客户端实例对于Broker而言会开辟一个Netty的客户端实例。 而ClientID是由ClientIP+InstanceName构成，故如果一个进程中多个实例（无论Producer还是Consumer）ClientIP和InstanceName都一样,他们将公用一个内部实例（同一套网络连接，线程资源等）

此外，此ClientID在对于Consumer负载均衡的时候起到唯一标识的作用，一旦多个实例（无论不同进程、不通机器、还是同一进程）的多个Consumer实例有一样的ClientID，负载均衡的时候必然RocketMQ任然会把两个实例当作一个client（因为同样一个clientID）。 故为了避免不必要的问题，ClientIP+instance Name的组合建议唯一，除非有意需要共用连接、资源。



### clientIP

| 配置说明 | 默认值 |
| ------| ------ | 
|客户端IP|`RemotingUtil.getLocalAddress()` | 


这个值有两个用处： 
1. 对于默认的`instanceName`（后面说明），如果没有显示设置，会使用ip+进程号，其中的ip便是这里的配置值
2. 对于Producer发送消息的时候，消息本身会存储本值到`bornHost`，用于标记消息从哪台机器产生的


### clientCallbackExecutorThreads

| 配置说明 | 默认值 |
| ------| ------ | 
|客户端通信层接收到网络请求的时候，处理器的核数|`Runtime.getRuntime().availableProcessors()`| 

虽然大部分指令的发起方是客户端而处理方是broker/NameServer端，但客户端有时候也需要处理远端对发送给自己的命令，最常见的是一些运维指令如`GET_CONSUMER_RUNNING_INFO`，或者消费实例上线/下线的推送指令`NOTIFY_CONSUMER_IDS_CHANGED`，这些指令的处理都在一个线程池处理，`clientCallbackExecutorThreads`控制这个线程池的核数。

### pollNameServerInterval*

| 配置说明 | 默认值 |
| ------| ------ | 
|轮询从NameServer获取路由信息的时间间隔|30000，单位毫秒| 

客户端依靠NameServer做服务发现（具体请看：[RocketMQ——组件](http://jaskey.github.io/blog/2016/12/14/rocketmq-component/ "RocketMQ——组件")），这个间隔决定了新服务上线/下线，客户端最长多久能探测得到。默认是30秒，就是说如果做broker扩容，最长需要30秒客户端才能感知得到新broker的存在。


### heartbeatBrokerInterval*

| 配置说明 | 默认值 |
| ------| ------ | 
|定期发送注册心跳到broker的间隔|30000，单位毫秒| 

客户端依靠心跳告诉broker“我是谁（clientID，ConsumerGroup/ProducerGroup）”，“自己是订阅了什么topic"，"要发送什么topic"。以此，broker会记录并维护这些信息。客户端如果动态更新这些信息，最长则需要这个心跳周期才能告诉broker。


### persistConsumerOffsetInterval*

| 配置说明 | 默认值 |
| ------| ------ | 
|作用于Consumer，持久化消费进度的间隔|5000，单位毫秒| 

RocketMQ采取的是定期批量ack的机制以持久化消费进度。也就是说每次消费消息结束后，并不会立刻ack，而是定期的集中的更新进度。 由于持久化不是立刻持久化的，所以如果消费实例突然退出（如断点）、或者触发了负载均衡分consue queue重排，有可能会有已经消费过的消费进度没有及时更新而导致重新投递。故本配置值越小，重复的概率越低，但同时也会增加网络通信的负担。

### vipChannelEnabled

| 配置说明 | 默认值 |
| ------| ------ | 
|是否启用vip netty通道以发送消息|-D com.rocketmq.sendMessageWithVIPChannel参数的值，若无则是true|

broker的netty server会起两个通信服务。两个服务除了服务的端口号不一样，其他都一样。其中一个的端口（配置端口-2）作为vip通道，客户端可以启用本设置项把发送消息此vip通道。 



------------------------------------------------------------------------------

## DefaultMQProducer

所有的消息发送都通过DefaultMQProducer作为入口，以下介绍一下单独属于DefaultMQProducer的一些配置项。

### producerGroup* 



| 配置说明 | 默认值 |
| ------| ------ | 
|生产组的名称，一类Producer的标识|DEFAULT_PRODUCER|

详见 [RocketMQ——角色与术语详解](http://jaskey.github.io/blog/2016/12/15/rocketmq-concept/ "RocketMQ——角色与术语详解")

### createTopicKey

| 配置说明 | 默认值 |
| ------| ------ | 
|发送消息的时候，如果没有找到topic，若想自动创建该topic，需要一个key topic，这个值即是key topic的值|TBW102|

这是RocketMQ设计非常晦涩的一个概念，整体的逻辑是这样的：

- 生产者正常的发送消息，都是需要topic**预先**创建好的
- 但是RocketMQ服务端是支持，发送消息的时候，如果topic不存在，在发送的同时自动创建该topic
- 支持的前提是broker 的配置打开`autoCreateTopicEnable=true`
- `autoCreateTopicEnable=true`后，broker会创建一个`TBW102`的topic，这个就是我们讲的默认的key topic

自动构建topic（以下成为T）的过程：

1. Producer发送的时候如果发现该T不存在，就会配置有Producer配置的key topic的那个broker发送消息
2. broker校验客户端的topic key是否在broker存在，且校验其权限最后一位是否是1（topic权限总共有3位，按位存储，分别是读、写、支持自动创建）
3. 若权限校验通过，先在该broker把T创建，并且权限就是key topic除去最后一位的权限。

为了方便理解，以下贴出broker的具体源码并加入部分注释：

                    TopicConfig defaultTopicConfig = this.topicConfigTable.get(defaultTopic);//key topic的配置信息
                    if (defaultTopicConfig != null) {//key topic 存在
                        if (defaultTopic.equals(MixAll.DEFAULT_TOPIC)) {
                            if (!this.brokerController.getBrokerConfig().isAutoCreateTopicEnable()) {
                                defaultTopicConfig.setPerm(PermName.PERM_READ | PermName.PERM_WRITE);
                            }
                        }

                        if (PermName.isInherited(defaultTopicConfig.getPerm())) {//检验权限，如果允许自动创建
                            topicConfig = new TopicConfig(topic);//创建topic

                            int queueNums =
                                clientDefaultTopicQueueNums > defaultTopicConfig.getWriteQueueNums() ? defaultTopicConfig
                                    .getWriteQueueNums() : clientDefaultTopicQueueNums;

                            if (queueNums < 0) {
                                queueNums = 0;
                            }

                            topicConfig.setReadQueueNums(queueNums);
                            topicConfig.setWriteQueueNums(queueNums);
                            int perm = defaultTopicConfig.getPerm();
                            perm &= ~PermName.PERM_INHERIT;//权限按照key topic的来
                            topicConfig.setPerm(perm);
                            topicConfig.setTopicSysFlag(topicSysFlag);
                            topicConfig.setTopicFilterType(defaultTopicConfig.getTopicFilterType());
                        } else {//权限校验不过，自动创建失败
                            LOG.warn("Create new topic failed, because the default topic[{}] has no perm [{}] producer:[{}]",
                                    defaultTopic, defaultTopicConfig.getPerm(), remoteAddress);
                        }
                    } else {//key topic不存在，创建失败
                        LOG.warn("Create new topic failed, because the default topic[{}] not exist. producer:[{}]", defaultTopic, remoteAddress);
                    }

                 ...//把创建的topic维护起来


总的来说，这个功能设计出来比较晦涩，而从运维的角度上看，topic在大部分场景下也应该预创建，故本特性没有必要的话，也不会用到，这个配置也没有必要特殊的设置。

关于这个TBW102非常不直观的问题，我已经提了issue ：https://issues.apache.org/jira/browse/ROCKETMQ-223

### defaultTopicQueueNums

| 配置说明 | 默认值 |
| ------| ------ | 
|自动创建topic的话，默认queue数量是多少|4|


### sendMsgTimeout

| 配置说明 | 默认值 |
| ------| ------ | 
|默认的发送超时时间|3000，单位毫秒|

若发送的时候不显示指定timeout，则使用此设置的值作为超时时间。

对于异步发送，超时后会进入回调的`onException`，对于同步发送，超时则会得到一个`RemotingTimeoutException`。

### compressMsgBodyOverHowmuch

| 配置说明 | 默认值 |
| ------| ------ | 
|消息body需要压缩的阈值|1024 * 4，4K|

### retryTimesWhenSendFailed
| 配置说明 | 默认值 |
| ------| ------ | 
|同步发送失败的话，rocketmq内部重试多少次|2|


### retryTimesWhenSendAsyncFailed
| 配置说明 | 默认值 |
| ------| ------ | 
|异步发送失败的话，rocketmq内部重试多少次|2|

### retryAnotherBrokerWhenNotStoreOK

| 配置说明 | 默认值 |
| ------| ------ | 
|发送的结果如果不是SEND_OK状态，是否当作失败处理而尝试重发|false|

发送结果总共有4钟：

    SEND_OK, //状态成功，无论同步还是存储
    FLUSH_DISK_TIMEOUT, // broker刷盘策略为同步刷盘（SYNC_FLUSH）的话时候，等待刷盘的时候超时
    FLUSH_SLAVE_TIMEOUT, // master role采取同步复制策略（SYNC_MASTER）的时候，消息尝试同步到slave超时
    SLAVE_NOT_AVAILABLE, //slave不可用


注：从源码上看，此配置项只对同步发送有效，异步、oneway（由于无法获取结果，肯定无效）均无效

### retryAnotherBrokerWhenNotStoreOK

| 配置说明 | 默认值 |
| ------| ------ | 
|客户端验证，允许发送的最大消息体大小|1024 * 1024 * 4，4M|

若超过此大小，会得到一个响应码13（MESSAGE_ILLEGAL）的`MQClientException`异常

--------------------------------------------------------

## TransactionMQProducer

事务生产者，截至至4.1，由于暂时事务回查功能缺失，整体并不完全可用，配置暂时忽略，等后面功能完善后补上。

https://issues.apache.org/jira/browse/ROCKETMQ-123


-------------------------------------------------------------

## DefaultMQPushConsumer

最常用的消费者，使用push模式（长轮询），封装了各种拉取的方法和返回结果的判断。下面介绍其配置。


### consumerGroup*

| 配置说明 | 默认值 |
| ------| ------ | 
|消费组的名称，用于标识一类消费者|无默认值，必设|

详见 [RocketMQ——角色与术语详解](http://jaskey.github.io/blog/2016/12/15/rocketmq-concept/ "RocketMQ——角色与术语详解")


### messageModel*

| 配置说明 | 默认值 |
| ------| ------ | 
|消费模式|MessageModel.CLUSTERING|

可选值有两个：

1. CLUSTERING //集群消费模式
2. BROADCASTING //广播消费模式

两种模式的区别详见：[RocketMQ——角色与术语详解](http://jaskey.github.io/blog/2016/12/15/rocketmq-concept/ "RocketMQ——角色与术语详解")


### consumeFromWhere*

| 配置说明 | 默认值 |
| ------| ------ | 
|消费点策略|ConsumeFromWhere.CONSUME_FROM_LAST_OFFSET|

可选值有两个：

1. CONSUME_FROM_LAST_OFFSET //队列尾消费
2. CONSUME_FROM_FIRST_OFFSET //队列头消费
3. CONSUME_FROM_TIMESTAMP //按照日期选择某个位置消费

注：此策略只生效于新在线测consumer group，如果是老的已存在的consumer group，都降按照已经持久化的consume offset进行消费

具体说明祥见： [RocketMQ——消息ACK机制及消费进度管理](http://jaskey.github.io/blog/2017/01/25/rocketmq-consume-offset-management/ "RocketMQ——消息ACK机制及消费进度管理")

### consumeTimestamp:

| 配置说明 | 默认值 |
| ------| ------ | 
|CONSUME_FROM_LAST_OFFSET的时候使用，从哪个时间点开始消费|半小时前|

格式为yyyyMMddhhmmss 如 20131223171201

### allocateMessageQueueStrategy* 

| 配置说明 | 默认值 |
| ------| ------ | 
|负载均衡策略算法|AllocateMessageQueueAveragely（取模平均分配）|

这个算法可以自行扩展以使用自定义的算法，目前有以下算法可以使用

- AllocateMessageQueueAveragely  //取模平均
- AllocateMessageQueueAveragelyByCircle //环形平均
- AllocateMessageQueueByConfig // 按照配置，传入听死的messageQueueList
- AllocateMessageQueueByMachineRoom //按机房，从源码上看，必须和阿里的某些broker命名一致才行
- AllocateMessageQueueConsistentHash //一致性哈希算法，本人于4.1提交的特性。用于解决“惊群效应”。
 
需要自行扩展的算法的，需要实现`org.apache.rocketmq.client.consumer.rebalance.AllocateMessageQueueStrategy`

具体分配consume queue的过程祥见： [RocketMQ——水平扩展及负载均衡详解](http://jaskey.github.io/blog/2016/12/19/rocketmq-rebalance/ "RocketMQ——水平扩展及负载均衡详解")

### subscription 

| 配置说明 | 默认值 |
| ------| ------ | 
|订阅关系（topic->sub expression）|{}|

不建议设置，订阅topic建议直接调用`subscribe`接口

### messageListener
| 配置说明 | 默认值 |
| ------| ------ | 
|消息处理监听器（回调）|null|

不建议设置，注册监听的时候应调用`registerMessageListener`

### offsetStore
 
| 配置说明 | 默认值 |
| ------| ------ | 
|消息消费进度存储器 |null|

不建议设置，`offsetStore` 有两个策略：`LocalFileOffsetStore` 和 `RemoteBrokerOffsetStore`。

若没有显示设置的情况下，广播模式将使用`LocalFileOffsetStore`，集群模式将使用`RemoteBrokerOffsetStore`，不建议修改。


### consumeThreadMin*

| 配置说明 | 默认值 |
| ------| ------ | 
|消费线程池的core size|20|

PushConsumer会内置一个消费线程池，这个配置控制此线程池的core size

### consumeThreadMax*

| 配置说明 | 默认值 |
| ------| ------ | 
|消费线程池的max size|64|

PushConsumer会内置一个消费线程池，这个配置控制此线程池的max size

### adjustThreadPoolNumsThreshold

| 配置说明 | 默认值 |
| ------| ------ | 
|动态扩线程核数的消费堆积阈值|1000|

相关功能以废弃，不建议设置

### consumeConcurrentlyMaxSpan

| 配置说明 | 默认值 |
| ------| ------ | 
|并发消费下，单条consume queue队列允许的最大offset跨度，达到则触发流控|2000|

注：只对并发消费（`ConsumeMessageConcurrentlyService`）生效

更多分析祥见： [RocketMQ——消息ACK机制及消费进度管理](http://jaskey.github.io/blog/2017/01/25/rocketmq-consume-offset-management/ "RocketMQ——消息ACK机制及消费进度管理")




### pullThresholdForQueue

| 配置说明 | 默认值 |
| ------| ------ | 
|consume queue流控的阈值|1000|

每条consume queue的消息拉取下来后会缓存到本地，消费结束会删除。当累积达到一个阈值后，会触发该consume queue的流控。

更多分析祥见： [RocketMQ——消息ACK机制及消费进度管理](http://jaskey.github.io/blog/2017/01/25/rocketmq-consume-offset-management/ "RocketMQ——消息ACK机制及消费进度管理")

截至到4.1，流控级别只能针对consume queue级别，针对topic级别的流控已经提了issue: https://issues.apache.org/jira/browse/ROCKETMQ-106

### pullInterval*

| 配置说明 | 默认值 |
| ------| ------ | 
|拉取的间隔|0，单位毫秒|

由于RocketMQ采取的pull的方式进行消息投递，每此会发起一个异步pull请求，得到请求后会再发起下次请求，这个间隔默认是0，表示立刻再发起。在间隔为0的场景下，消息投递的及时性几乎等同用Push实现的机制。

### pullBatchSize*
f
| 配置说明 | 默认值 |
| ------| ------ | 
|一次最大拉取的批量大小|32|

每次发起pull请求到broker，客户端需要指定一个最大batch size，表示这次拉取消息最多批量拉取多少条。

### consumeMessageBatchMaxSize

| 配置说明 | 默认值 |
| ------| ------ | 
|批量消费的最大消息条数|1|

你可能发现了，RocketMQ的注册监听器回调的回调方法签名是类似这样的：

    ConsumeConcurrentlyStatus consumeMessage(final List<MessageExt> msgs, final ConsumeConcurrentlyContext context);

里面的消息是一个集合List而不是单独的msg，这个`consumeMessageBatchMaxSize`就是控制这个集合的最大大小。

而由于拉取到的一批消息会立刻拆分成N（取决于consumeMessageBatchMaxSize）批消费任务，所以集合中msgs的最大大小是`consumeMessageBatchMaxSize`和`pullBatchSize`的较小值。

### postSubscriptionWhenPull

| 配置说明 | 默认值 |
| ------| ------ | 
|每次拉取的时候是否更新订阅关系|false|

从源码上看，这个值若是true,且不是class fliter模式，则每次拉取的时候会把subExpression带上到pull的指令中，broker发现这个指令会根据这个上传的表达式重新build出注册数据，而不是直接使用读取的缓存数据。

### maxReconsumeTimes

| 配置说明 | 默认值 |
| ------| ------ | 
|一个消息如果消费失败的话，最多重新消费多少次才投递到死信队列|-1|

注，这个值默认值虽然是-1，但是实际使用的时候默认并不是-1。按照消费是并行还是串行消费有所不同的默认值。

并行：默认16次

串行：默认无限大（Interge.MAX_VALUE）。由于顺序消费的特性必须等待前面的消息成功消费才能消费后面的，默认无限大即一直不断消费直到消费完成。


### suspendCurrentQueueTimeMillis

| 配置说明 | 默认值 |
| ------| ------ | 
|串行消费使用，如果返回`ROLLBACK`或者`SUSPEND_CURRENT_QUEUE_A_MOMENT`，再次消费的时间间隔|1000，单位毫秒|

注：如果消费回调中对`ConsumeOrderlyContext`中的`suspendCurrentQueueTimeMillis`进行过设置，则使用用户设置的值作为消费间隔。


### consumeTimeout

| 配置说明 | 默认值 |
| ------| ------ | 
|消费的最长超时时间|15，** 单位分钟 **|

如果消费超时，RocketMQ会等同于消费失败来处理，更多分析祥见： [RocketMQ——消息ACK机制及消费进度管理](http://jaskey.github.io/blog/2017/01/25/rocketmq-consume-offset-management/ "RocketMQ——消息ACK机制及消费进度管理")




-------------------------------------------------------------

## DefaultMQPullConsumer

采取主动调用Pull接口的模式的消费者，主动权更大，但是使用难度也相对更大。以下介绍其配置，部分配置和PushConsumer一致。



### consumerGroup*

| 配置说明 | 默认值 |
| ------| ------ | 
|消费组的名称，用于标识一类消费者|无默认值，必设|

详见 [RocketMQ——角色与术语详解](http://jaskey.github.io/blog/2016/12/15/rocketmq-concept/ "RocketMQ——角色与术语详解")

### registerTopics*
| 配置说明 | 默认值 |
| ------| ------ | 
|消费者需要监听的topic|空集合|

由于没有subscribe接口，用户需要自己把想要监听的topic设置到此集合中，RocketMQ内部会依靠此来发送对应心跳数据。

### messageModel*

| 配置说明 | 默认值 |
| ------| ------ | 
|消费模式|MessageModel.CLUSTERING|

可选值有两个：

1. CLUSTERING //集群消费模式
2. BROADCASTING //广播消费模式

两种模式的区别详见：[RocketMQ——角色与术语详解](http://jaskey.github.io/blog/2016/12/15/rocketmq-concept/ "RocketMQ——角色与术语详解")

### allocateMessageQueueStrategy* 

| 配置说明 | 默认值 |
| ------| ------ | 
|负载均衡策略算法|AllocateMessageQueueAveragely（取模平均分配）|

见DefaultPushConsumer的说明


### offsetStore
 
| 配置说明 | 默认值 |
| ------| ------ | 
|消息消费进度存储器 |null|

不建议设置，`offsetStore` 有两个策略：`LocalFileOffsetStore` 和 `RemoteBrokerOffsetStore`。

若没有显示设置的情况下，广播模式将使用`LocalFileOffsetStore`，集群模式将使用`RemoteBrokerOffsetStore`，不建议修改。



### maxReconsumeTimes

| 配置说明 | 默认值 |
| ------| ------ | 
|调用`sendMessageBack`的时候，如果发现重新消费超过这个配置的值，则投递到死信队列|16|

由于PullConsumer没有管理消费的线程池和管理器，需要用户自己处理各种消费结果和拉取结果，故需要投递到重试队列或死信队列的时候需要显示调用`sendMessageBack`。

回传消息的时候会带上maxReconsumeTimes的值，broker发现此消息已经消费超过此值，则投递到死信队列，否则投递到重试队列。此逻辑和`DefaultPushConsumer`是一致的，只是PushConsumer无需用户显示调用。

### brokerSuspendMaxTimeMillis

| 配置说明 | 默认值 |
| ------| ------ | 
|broker在长轮询下，连接最长挂起的时间|20*1000，单位毫秒|

长轮询具体逻辑不在本文论述，且RocketMQ不建议修改此值。

### consumerTimeoutMillisWhenSuspend

| 配置说明 | 默认值 |
| ------| ------ | 
|broker在长轮询下，客户端等待broker响应的最长等待超时时间|30*1000，单位毫秒|

长轮询具体逻辑不在本文论述，且RocketMQ不建议修改此值，此值一定要大于`brokerSuspendMaxTimeMillis`

### consumerPullTimeoutMillis

| 配置说明 | 默认值 |
| ------| ------ | 
|pull的socket 超时时间|10*1000，单位毫秒|

虽然注释上说是socket超时时间，但是从源码上看，此值的设计是不启动长轮询也不指定timeout的情况下，拉取的超时时间。

### messageQueueListener


| 配置说明 | 默认值 |
| ------| ------ | 
|负载均衡consume queue分配变化的通知监听器|null|

由于pull操作需要用户自己去触发，故如果负载均衡发生变化，要有方法告知用户现在分到的新consume queue是什么。使用方可以实现此接口以达到此目的：
    
    /**
     * A MessageQueueListener is implemented by the application and may be specified when a message queue changed
     */
    public interface MessageQueueListener {
    /**
     * @param topic message topic
     * @param mqAll all queues in this message topic
     * @param mqDivided collection of queues,assigned to the current consumer
     */
    void messageQueueChanged(final String topic, final Set<MessageQueue> mqAll,final Set<MessageQueue> mqDivided);
    }
      

