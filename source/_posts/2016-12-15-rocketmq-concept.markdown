---
layout: post
title: "RocketMQ——角色与术语详解"
date: 2016-12-15 15:48:01 +0800
comments: true
categories: java rocketmq
keywords: java , rocketmq, broker, nameserver, filterserver
description: 
---

RocketMQ中有很多概念，其中包括一些术语和角色。

理清楚基本的概念能有效的帮助理解RocketMQ的原理以及排查问题。

## 角色：

### Producer

生产者。发送消息的客户端角色。发送消息的时候需要指定Topic。

### Consumer
消费者。消费消息的客户端角色。通常是后台处理异步消费的系统。 RocketMQ中Consumer有两种实现：PushConsumer和PullConsumer。

#### PushConsumer
推送模式（虽然RocketMQ使用的是长轮询）的消费者。消息的能及时被消费。使用非常简单，内部已处理如线程池消费、流控、负载均衡、异常处理等等的各种场景。

#### PullConsumer
拉取模式的消费者。应用主动控制拉取的时机，怎么拉取，怎么消费等。主动权更高。但要自己处理各种场景。



##概念术语

### Producer Group

标识发送同一类消息的Producer，通常发送逻辑一致。发送普通消息的时候，仅标识使用，并无特别用处。若事务消息，如果某条发送某条消息的producer-A宕机，使得事务消息一直处于PREPARED状态并超时，则broker会回查同一个group的其 他producer，确认这条消息应该commit还是rollback。但开源版本并不支持事务消息。

### Consumer Group

标识一类Consumer的集合名称，这类Consumer通常消费一类消息，且消费逻辑一致。同一个Consumer Group下的各个实例将共同消费topic的消息，起到负载均衡的作用。

消费进度以Consumer Group为粒度管理，不同Consumer Group之间消费进度彼此不受影响，即消息A被Consumer Group1消费过，也会再给Consumer Group2消费。

注： RocketMQ要求同一个Consumer Group的消费者必须要拥有相同的注册信息，即必须要听一样的topic(并且tag也一样)。

### Topic

标识一类消息的逻辑名字，消息的逻辑管理单位。无论消息生产还是消费，都需要指定Topic。

### Tag

RocketMQ支持给在发送的时候给topic打tag，同一个topic的消息虽然逻辑管理是一样的。但是消费topic1的时候，如果你订阅的时候指定的是tagA，那么tagB的消息将不会投递。

### Message Queue

简称Queue或Q。消息物理管理单位。一个Topic将有若干个Q。若Topic同时创建在不通的Broker，则不同的broker上都有若干Q，消息将物理地存储落在不同Broker结点上，具有水平扩展的能力。

无论生产者还是消费者，实际的生产和消费都是针对Q级别。例如Producer发送消息的时候，会预先选择（默认轮询）好该Topic下面的某一条Q地发送；Consumer消费的时候也会负载均衡地分配若干个Q，只拉取对应Q的消息。

每一条message queue均对应一个文件，这个文件存储了实际消息的索引信息。并且即使文件被删除，也能通过实际纯粹的消息文件（commit log）恢复回来。

### Offset

RocketMQ中，有很多offset的概念。但通常我们只关心暴露到客户端的offset。一般我们不特指的话，就是指逻辑Message Queue下面的offset。

可以认为一条逻辑的message queue是无限长的数组。一条消息进来下标就会涨1。下标就是offset。

一条message queue中的max offset表示消息的最大offset。注：这里从源码上看，max_offset并不是最新的那条消息的offset，而是表示最新消息的offset+1。

而min offset则标识现存在的最小offset。

由于消息存储一段时间后，消费会被物理地从磁盘删除，message queue的min offset也就对应增长。这意味着比min offset要小的那些消息已经不在broker上了，无法被消费。

### 消费进度

又称consumer offset，用于标记Consumer Group在一条逻辑Message Queue上，消息消费到哪里。注：从源码上看，这个数值是最新消费的那条消息的offset+1。

消费者拉取消息的时候需要指定offset，broker不主动推送消息，而是接受到请求的时候把存储的对应offset的消息返回给客户端。这个offset在成功消费后会更新到内存，并定时持久化。在集群消费模式下，会同步持久化到broker。在广播模式下，会持久化到本地文件。

实例重启的时候会获取持久化的consumer offset，用以决定从哪里开始消费。

### 集群消费

消费者的一种消费模式。一个Consumer Group中的各个Consumer实例分摊去消费消息，即一条消息只会投递到一个Consumer Group下面的一个实例。

实际上，每个Consumer是平均分摊Message Queue的去做拉取消费。例如某个Topic有3条Q，其中一个Consumer Group 有 3 个实例（可能是 3 个进程，或者 3 台机器），那么每个实例只消费其中的1条Q。

而由Producer发送消息的时候是轮询所有的Q,所以消息会平均散落在不同的Q上，可以认为Q上的消息是平均的。那么实例也就平均地消费消息了。

这种模式下，消费进度的存储会持久化到Broker。


### 广播消费

消费者的一种消费模式。消息将对一个Consumer Group下的各个Consumer实例都投递一遍。即即使这些 Consumer 属于同一个Consumer Group，消息也会被Consumer Group 中的每个Consumer都消费一次。

实际上，是一个消费组下的每个消费者实例都获取到了topic下面的每个Message Queue去拉取消费。所以消息会投递到每个消费者实例。

这种模式下，消费进度会存储持久化到实例本地。


### 顺序消息

消费消息的顺序要同发送消息的顺序一致。由于Consumer消费消息的时候是针对Message Queue顺序拉取并开始消费，且一条Message Queue只会给一个消费者（集群模式下），所以能够保证同一个消费者实例对于Q上消息的消费是顺序地开始消费（不一定顺序消费完成，因为消费可能并行）。

在RocketMQ中，顺序消费主要指的是都是Queue级别的局部顺序。这一类消息为满足顺序性，必须Producer单线程顺序发送，且发送到同一个队列，这样Consumer就可以按照Producer发送的顺序去消费消息。


生产者发送的时候可以用MessageQueueSelector为某一批消息（通常是有相同的唯一标示id）选择同一个Queue，则这一批消息的消费将是顺序消息（并由同一个consumer完成消息）。或者Message Queue的数量只有1，但这样消费的实例只能有一个，多出来的实例都会空跑。

### 普通顺序消息

顺序消息的一种，正常情况下可以保证完全的顺序消息，但是一旦发生异常，Broker宕机或重启，由于队列总数发生发化，消费者会触发负载均衡，而默认地负载均衡算法采取哈希取模平均，这样负载均衡分配到定位的队列会发化，使得队列可能分配到别的实例上，则会短暂地出现消息顺序不一致。

如果业务能容忍在集群异常情况（如某个 Broker 宕机或者重启）下，消息短暂的乱序，使用普通顺序方式比较合适。


### 严格顺序消息

顺序消息的一种，无论正常异常情况都能保证顺序，但是牺牲了分布式 Failover 特性，即 Broker集群中只要有一台机器不可用，则整个集群都不可用，服务可用性大大降低。

如果服务器部署为同步双写模式，此缺陷可通过备机自动切换为主避免，不过仍然会存在几分钟的服务不可用。（依赖同步双写，主备自动切换，自动切换功能目前并未实现）

目前已知的应用只有数据库 binlog 同步强依赖严格顺序消息，其他应用绝大部分都可以容忍短暂乱序，推荐使用普通的顺序消息