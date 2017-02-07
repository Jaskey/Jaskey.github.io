---
layout: post
title: "RocketMQ——消息ACK机制及消费进度管理"
date: 2017-01-25 20:49:23 +0800
comments: true
categories: java rocketmq
keywords: java , rocketmq, broker, nameserver, filterserver, netty
description: 
---

[RokectMQ——水平扩展及负载均衡详解](http://jaskey.github.io/blog/2016/12/19/rocketmq-rebalance/ "RokectMQ——水平扩展及负载均衡详解") 中剖析过，consumer的每个实例是靠队列分配来决定如何消费消息的。那么消费进度具体是如何管理的，又是如何保证消息成功消费的（RocketMQ有保证消息肯定消费成功的特性（失败则重试）？

本文将详细解析消息具体是如何ack的，又是如何保证消费肯定成功的。

由于以上工作所有的机制都实现在PushConsumer中，所以本文的原理均只适用于RocketMQ中的PushConsumer即Java客户端中的`DefaultPushConsumer`。 若使用了PullConsumer模式，类似的工作如何ack，如何保证消费等均需要使用方自己实现。

注：广播消费和集群消费的处理有部分区别，以下均特指集群消费（CLSUTER），广播（BROADCASTING）下部分可能不适用。

## 保证消费成功

PushConsumer为了保证消息肯定消费成功，只有使用方明确表示消费成功，RocketMQ才会认为消息消费成功。中途断电，抛出异常等都不会认为成功——即都会重新投递。

消费的时候，我们需要注入一个消费回调，具体sample代码如下：


        consumer.registerMessageListener(new MessageListenerConcurrently() {
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs, ConsumeConcurrentlyContext context) {
                System.out.println(Thread.currentThread().getName() + " Receive New Messages: " + msgs);
				doMyJob();//执行真正消费
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });


业务实现消费回调的时候，当且仅当此回调函数返回`ConsumeConcurrentlyStatus.CONSUME_SUCCESS`，RocketMQ才会认为这批消息（默认是1条）是消费完成的。（具体如何ACK见后面章节）

如果这时候消息消费失败，例如数据库异常，余额不足扣款失败等一切业务认为消息需要重试的场景，只要返回`ConsumeConcurrentlyStatus.RECONSUME_LATER`，RocketMQ就会认为这批消息消费失败了。

为了保证消息是肯定被至少消费成功一次，RocketMQ会把这批消息重发回Broker（topic不是原topic而是这个消费租的RETRY topic），在延迟的某个时间点（默认是10秒，业务可设置）后，再次投递到这个ConsumerGroup。而如果一直这样重复消费都持续失败到一定次数（默认16次），就会投递到DLQ死信队列。应用可以监控死信队列来做人工干预。

注：

1. 如果业务的回调没有处理好而抛出异常，会认为是消费失败当`ConsumeConcurrentlyStatus.RECONSUME_LATER`处理。
2. 当使用顺序消费的回调`MessageListenerOrderly`时，由于顺序消费是要前者消费成功才能继续消费，所以没有`RECONSUME_LATER`的这个状态，只有`SUSPEND_CURRENT_QUEUE_A_MOMENT`来暂停队列的其余消费，直到原消息不断重试成功为止才能继续消费。



## 消费完后的消息去哪里了？

消息存储在broker之后，会一直存储在磁盘直到消息文件过期（默认48小时）或磁盘已经达到上限必须释放（85%水位线）的时候，才会批量删除消息文件（CommitLog）。

所以即使消息被消费了，消息也不会立刻被删除。并且，从哪里(offset)消费的决定权一直都是客户端决定。一开始启动的时候，客户端会询问broker端消费组的消费进度，按照这个进度开始不断往前消费。

而broker端只是按照客户端需要而搜索出对应消息即可，这样做有几个好处：

1. 一个消息很可能需要被N个消费组（设计上很可能就是系统）消费，但消息只需要存储一份，消费进度单独记录即可。这给强大的消息堆积能力提供了很好的支持。
2. 由于消费从哪里消费的决定权一直都是客户端决定，所以只要消息还在，就可以消息，这使得RocketMQ可以支持其他传统消息中间件不支持的回溯消费。
3. 消息索引服务。只要消息还存在就能被搜索出来。所以可以依靠消息的索引搜索出消息的各种原信息，方便事后排查问题。

消息既然一直没有删除，那RocketMQ怎么知道应该投递不重复的消息呢——答案是客户端自身维护，主动告诉broker。

在PushConsumer中，RocketMQ有一条拉取线程，每次拉取到消息之后都会按照消息拉取到的结果来调整下一次应该从哪里拉取，这样就保证了正常情况下，消息只会被投递一次。

## 启动的时候从哪里消费

当新实例启动的时候，PushConsumer会拿到本消费组broker已经记录好的消费进度（consumer offset），按照这个进度发起自己的第一次Pull请求。

如果这个消费进度在Broker并没有存储起来，证明这个是一个全新的消费组，这时候客户端有几个策略可以选择：

    CONSUME_FROM_LAST_OFFSET //默认策略，从该队列最尾开始消费，即跳过历史消息
	CONSUME_FROM_FIRST_OFFSET //从队列最开始开始消费，即历史消息（还储存在broker的）全部消费一遍
    CONSUME_FROM_TIMESTAMP//从某个时间点开始消费，和setConsumeTimestamp()配合使用，默认是半个小时以前


所以，社区中经常有人问：“为什么我设了`CONSUME_FROM_LAST_OFFSET`，历史的消息还是被消费了”？ 原因就在于只有全新的消费组才会使用到这些策略，老的消费组都是按已经存储过的消费进度继续消费。

对于老消费组想跳过历史消息可以采用以下两种方法：

1. 代码按照日期判断，太老的消息直接return CONSUME_SUCCESS过滤。
2. 代码判断消息的offset和MAX_OFFSET相差很远，认为是积压了很多，直接return CONSUME_SUCCESS过滤。
3. 消费者**启动前**，先调整该消费组的消费进度，再开始消费。可以人工使用命令`resetOffsetByTime`，或调用内部的运维接口，祥见`ResetOffsetByTimeCommand.java`

## 消息ACK机制

RocketMQ是以consumer group+queue为单位是管理消费进度的，以一个consumer offset标记这个这个消费组在这条queue上的消费进度。

如果某已存在的消费组出现了新消费实例的时候，依靠这个组的消费进度，就可以判断第一次是从哪里开始拉取的。

每次消息成功后，本地的消费进度会被更新，然后由定时器定时同步到broker，以此持久化消费进度。

但是每次记录消费进度的时候，只会把一批消息中最小的offset值为消费进度值，如下图：

![message ack](/images/rocketmq/rocketmq-ack.png "message ack")

这钟方式和传统的一条message单独ack的方式有本质的区别。性能上提升的同时，会带来一个潜在的重复问题——由于消费进度只是记录了一个下标，就可能出现拉取了100条消息如 2101-2200的消息，后面99条都消费结束了，只有2101消费一直没有结束的情况。

在这种情况下，RocketMQ为了保证消息肯定被消费成功，消费进度职能维持在2101，直到2101也消费结束了，本地的消费进度才会一下子更新到2200。

在这种设计下，就有消费大量重复的风险。如2101在还没有消费完成的时候消费实例突然退出（机器断电，或者被kill）。这条queue的消费进度还是维持在2101，当queue重新分配给新的实例的时候，新的实例从broker上拿到的消费进度还是维持在2101，这时候就会又从2101开始消费，2102-2200这批消息实际上已经被消费过还是会投递一次。

对于这个场景，RocketMQ暂时无能为力，所以业务必须要保证消息消费的幂等性，这也是RocketMQ官方多次强调的态度。

实际上，从源码的角度上看，RocketMQ可能是考虑过这个问题的，截止到3.2.6的版本的源码中，可以看到为了缓解这个问题的影响面，`DefaultMQPushConsumer`中有个配置`consumeConcurrentlyMaxSpan`

    
    /**
     * Concurrently max span offset.it has no effect on sequential consumption
     */
    private int consumeConcurrentlyMaxSpan = 2000;


这个值默认是2000，当RocketMQ发现本地缓存的消息的最大值-最小值差距大于这个值（2000）的时候，会触发流控——也就是说如果头尾都卡住了部分消息，达到了这个阈值就不再拉取消息。

但作用实际很有限，像刚刚这个例子，2101的消费是死循环，其他消费非常正常的话，是无能为力的。一旦退出，在不人工干预的情况下，2101后所有消息全部重复!


### Ack卡进度解决方案

实际上对于卡住进度的场景，可以选择弃车保帅的方案：把消息卡住那些消息，先ack掉，让进度前移。但要保证这条消息不会因此丢失，ack之前要把消息sendBack回去，这样这条卡住的消息就会必然重复，但会解决潜在的大量重复的场景。 这也是我们公司**自己定制**的解决方案。

   部分源码如下：

    class ConsumeRequestWithUnAck implements Runnable {
        final ConsumeRequest consumeRequest;
        final long resendAfterIfStillUnAck;//n毫秒没有消费完，就重发

        ConsumeRequestWithUnAck(ConsumeRequest consumeRequest,long resendAfterIfStillUnAck) {
            this.consumeRequest = consumeRequest;
            this.resendAfterIfStillUnAck = resendAfterIfStillUnAck;
        }

        @Override
        public void run() {
            //每次消费前，计划延时任务，超时则ack并重发
            final WeakReference<ConsumeRequest> crReff = new WeakReference<>(this.consumeRequest);
            ScheduledFuture scheduledFuture=null;
            if(!ConsumeDispatcher.this.ackAndResendScheduler.isShutdown()) {
                scheduledFuture= ConsumeDispatcher.this.ackAndResendScheduler.schedule(new ConsumeTooLongChecker(crReff),resendAfterIfStillUnAck,TimeUnit.MILLISECONDS);
            }
            try{
                this.consumeRequest.run();//正常执行并更新offset
            }
            finally {
                if (scheduledFuture != null) scheduledFuture.cancel(false);//消费结束后,取消任务
            }
        }

    }

1. 定义了一个装饰器，把原来的ConsumeRequest对象包了一层。
2. 装饰器中，每条消息消费前都会调度一个调度器，定时触发，触发的时候如果发现消息还存在，就执行sendback并ack的操作。


后来RocketMQ显然也发现了这个问题，RocketMQ在3.5.8之后也是采用这样的方案去解决这个问题。只是实现方式上有所不同（事实上我认为RocketMQ的方案还不够完善）

1. 在pushConsumer中 有一个`consumeTimeout`字段（默认15分钟），用于设置最大的消费超时时间。消费前会记录一个消费的开始时间，后面用于比对。
2. 消费者启动的时候，会定期扫描所有消费的消息，达到这个timeout的那些消息，就会触发sendBack并ack的操作。这里扫描的间隔也是consumeTimeout（单位分钟）的间隔。


核心源码如下：
	
	//ConsumeMessageConcurrentlyService.java
    public void start() {
        this.CleanExpireMsgExecutors.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                cleanExpireMsg();
            }

        }, this.defaultMQPushConsumer.getConsumeTimeout(), this.defaultMQPushConsumer.getConsumeTimeout(), TimeUnit.MINUTES);
    }
	//ConsumeMessageConcurrentlyService.java
    private void cleanExpireMsg() {
        Iterator<Map.Entry<MessageQueue, ProcessQueue>> it =
                this.defaultMQPushConsumerImpl.getRebalanceImpl().getProcessQueueTable().entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<MessageQueue, ProcessQueue> next = it.next();
            ProcessQueue pq = next.getValue();
            pq.cleanExpiredMsg(this.defaultMQPushConsumer);
        }
    }

	//ProcessQueue.java
    public void cleanExpiredMsg(DefaultMQPushConsumer pushConsumer) {
        if (pushConsumer.getDefaultMQPushConsumerImpl().isConsumeOrderly()) {
            return;
        }
        
        int loop = msgTreeMap.size() < 16 ? msgTreeMap.size() : 16;
        for (int i = 0; i < loop; i++) {
            MessageExt msg = null;
            try {
                this.lockTreeMap.readLock().lockInterruptibly();
                try {
                    if (!msgTreeMap.isEmpty() && System.currentTimeMillis() - Long.parseLong(MessageAccessor.getConsumeStartTimeStamp(msgTreeMap.firstEntry().getValue())) > pushConsumer.getConsumeTimeout() * 60 * 1000) {
                        msg = msgTreeMap.firstEntry().getValue();
                    } else {

                        break;
                    }
                } finally {
                    this.lockTreeMap.readLock().unlock();
                }
            } catch (InterruptedException e) {
                log.error("getExpiredMsg exception", e);
            }

            try {

                pushConsumer.sendMessageBack(msg, 3);
                log.info("send expire msg back. topic={}, msgId={}, storeHost={}, queueId={}, queueOffset={}", msg.getTopic(), msg.getMsgId(), msg.getStoreHost(), msg.getQueueId(), msg.getQueueOffset());
                try {
                    this.lockTreeMap.writeLock().lockInterruptibly();
                    try {
                        if (!msgTreeMap.isEmpty() && msg.getQueueOffset() == msgTreeMap.firstKey()) {
                            try {
                                msgTreeMap.remove(msgTreeMap.firstKey());
                            } catch (Exception e) {
                                log.error("send expired msg exception", e);
                            }
                        }
                    } finally {
                        this.lockTreeMap.writeLock().unlock();
                    }
                } catch (InterruptedException e) {
                    log.error("getExpiredMsg exception", e);
                }
            } catch (Exception e) {
                log.error("send expired msg exception", e);
            }
        }
    }

通过这个逻辑对比我定制的时间，可以看出有几个不太完善的问题：

1. 消费timeout的时间非常不精确。由于扫描的间隔是15分钟，所以实际上触发的时候，消息是有可能卡住了接近30分钟（15*2）才被清理。
2. 由于定时器一启动就开始调度了，中途这个consumeTimeout再更新也不会生效。




