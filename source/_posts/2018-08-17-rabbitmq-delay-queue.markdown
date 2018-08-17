---
layout: post
title: "RabbitMQ实现延迟队列"
date: 2018-08-15 14:56:56 +0800
comments: true
categories: 
keywords: java rabbbitmq
description: java , rabbbitmq
---


RabbitMQ本身没有延迟队列的支持，但是基于其本身的一些特性，可以做到类似延迟队列的效果：基于死信交换器+TTL。



以下介绍下相关概念及方法



## Dead Letter Exchanges


消息在队列满足达到一定的条件，会被认为是死信消息（dead-lettered），这时候，RabbitMQ会重新把这类消息发到另外一个的exchange，这个exchange称为Dead Letter Exchanges.


以下任一条件满足，即可认为是死信：

- 消息被拒绝消费(basic.reject or basic.nack)并且设置了requeue=fasle
- 消息的TTL到了（消息过期） 
- 达到了队列的长度限制


需要注意的是，Dead letter exchanges (DLXs) 其实就是普通的exchange，可以和正常的exchange一样的声明或者使用。


## 死信消息路由

队列中可以设置两个属性：

- x-dead-letter-exchange
- x-dead-letter-routing-key


当这个队列里面的消息成为死信之后，就会投递到x-dead-letter-exchange指定的exchange中，其中带着的routing key就是中指定的值x-dead-letter-routing-key。



而如果使用默认的exchange(routing key就是希望指定的队列)，则只需要把x-dead-letter-exchange设置为空（不能不设置），类似下面

![rabbitmq 延迟队列的配置](http://jaskey.github.io/images/rabbitmq/delay-queue-param.png "rabbitmq 延迟队列的配置")


死信消息的路由则会根据x-dead-letter-routing-key所指定的进行路由，如果这个值没有指定，则会按照消息一开始发送的时候指定的routing key进行路由

> 
> Dead-lettered messages are routed to their dead letter exchange either:
> 
> with the routing key specified for the queue they were on; or, if this was not set,
> with the same routing keys they were originally published with.



例如，如果一开始你对exchange X发送消息，带着routing key "foo"，进入了队列 Q然后消息变死信后，他会被重新发送到 dead letter exchange ，其中发给dead letter exchange带着的routing key 还是foo。 但如果这个队列Q本身是设置了x-dead-letter-routing-key  bar， 那么他发送到 dead letter exchange的时候，带着的routing key 就是bar。



需要注意的是，当死信消息重新路由到新的队列的时候，在死信目标队列确认收到这条死信消息之前，原来队列的消息是不会删除的，也就是说在某些异常场景下例如broker突然shutdown，是有机会存在说一个消息既存在于原队列，又存在于死信目标队列。具体可参考官方说明：



> Dead-lettered messages are re-published with publisher confirms turned on internally so, the "dead-letter queues" (DLX routing targets) the messages eventually land on must confirm the messages before they are removed from the original queue. In other words, the "publishing" (the one in which messages expired) queue will not remove messages before the dead-letter queues acknowledge receiving them (see Confirms for details on the guarantees made). Note that, in the event of an unclean broker shutdown, the same message may be duplicated on both the original queue and on the dead-lettering destination queues.







## Time-To-Live（TTL）


开头我们说过，实现延迟队列除了用死信消息外，还需要利用消息过期的TTL机制，因为只要消息过期了，就会触发死信。

RabbitMQ有两种方法让设置消息的TTL：


### 直接在消息上设置

    byte[] messageBodyBytes = "Hello, world!".getBytes();
    AMQP.BasicProperties properties = new AMQP.BasicProperties.Builder()
    .expiration("60000")
    .build();
    channel.basicPublish("my-exchange", "routing-key", properties, messageBodyBytes);
    


### 为队列设置消息过期TTL




![rabbitmq x-message-ttl](http://jaskey.github.io/images/rabbitmq/x-message-ttl.png "rabbitmq x-message-ttl")



注意，队列还有一个队列TTL，x-expires，这个的意思是队列空置经过一段时间（没有消费者，没有被重新声明，没有人在上面获取消息（basic.get））后，整个队列便会过期删除，不要混淆




**如果同时设置了消息的过期和队列消息过期属性，则取两个较小值。**








## 设计延迟队列：


例如，我们需要触发一个推送新闻，30分钟后统计这个新闻的下发情况，我们就需要一个延迟队列，新闻推送后，往延迟队列发送一个消息，这个队列的消息在30分钟后被消费，这时候触发即可统计30分钟的下发情况。我们可以这样设计：



定义一个正常的队列： ARRIVAL_STAT，统计程序监听此队列，进行消费。

定义一个“延迟队列”（RabbitMQ没有这样的队列，这里只是人为的制造一个这样的队列）：DELAY_ARRIVAL_STAT，其中设置好对应的x-dead-letter-exchange，x-dead-letter-routing-key。为了简单说明，我使用默认的exchange，那么配置如下：

    x-dead-letter-exchange=“”
    x-dead-letter-routing-key=“ARRIVAL_STAT”



意思是，消息当这个队列DELAY_ARRIVAL_STAT的消息变死信之后，就会带着routing key "ARRIVAL_STAT"发送默认的空exchange，即队列ARRIVAL_STAT。

并且这个队列不能有消费者消费消息。



这样我们就实现了消息的死信转发。下一步，只需要让消息在这个DELAY_ARRIVAL_STAT在30分钟后过期变死信即可。按照上文所说，有两种方法，我们可以为队列的消息设置30分钟TTL，或者发送消息的时候指定消息的TTL为30分钟即可。



示例如下：


![rabbitmq 延迟队列示意](http://jaskey.github.io/images/rabbitmq/delay-queue-demo.png "rabbitmq 延迟队列示意")






## “延迟队列”的堵塞缺陷


由于设置了x-dead-letter-exchange的队列本身也是普通队列，其过期的顺序是按照队列头部顺序的过期的。也就是说，如果你队列头的消息A过期时间是5分钟，后面对这个队列发送消息B的带着过期时间1分钟，那么后面的队列B要等队列A过期了才会触发过期：



> Queues that had a per-message TTL applied to them retroactively (when they already had messages) will discard the messages when specific events occur. Only when expired messages reach the head of a queue will they actually be discarded (or dead-lettered).





所以，对于此类多延迟时间的，可以考虑设置多级延迟队列。例如1分钟，5分钟，10分钟，20分钟这样多级的延迟队列，使得延迟相近的尽量放到同一个队列中减少拥堵的最坏情况。

![rabbitmq 多级延迟队列](http://jaskey.github.io/images/rabbitmq/multi-delay-queue "rabbitmq 多级延迟队列")