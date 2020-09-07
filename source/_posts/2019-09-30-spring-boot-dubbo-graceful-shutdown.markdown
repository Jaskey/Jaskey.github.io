---
layout: post
title: "SpringBoot+Dubbo优雅退出分析及方案"
date: 2019-09-30 14:56:56 +0800
comments: true
categories: 
keywords: java spring boot dubbo shutdownhook 优雅退出
description: java , spring boot , dubbo
---



背景：

当我们使用SpringBoot+D做微服务的时候，可能再服务停机的过程，发现在一瞬间出现一些报错，最典型的如比如拿到的数据库连接已经关闭等问题，如下图所示：

![img](http://jaskey.github.io/images/dubbo-shutdown-hook/dubbo-shutdown-problem.png)



从日志错误可以看到，停机时还存在正在处理的请求，而此请求需要访问数据源，但数据源的资源被 Spring 容器关闭了，导致获取不到而报错。

但是实际上，无论Dubbo和Spring其实都实现了优雅退出，为什么最后退出还是不那么优雅呢？

要分析这个问题，首先得分析它们两者的优雅退出实现。





# Dubbo优雅退出

dubbo框架本身基于ShutdownHook注册了一个优雅退出的钩子，背后会调用其destroyAll来实现自身的优雅关闭。



以下是Dubbo 2.6.2的源码：

![img](http://jaskey.github.io/images/dubbo-shutdown-hook/dubbo-shutdown-sourcecode-1.png)

![img](http://jaskey.github.io/images/dubbo-shutdown-hook/dubbo-shutdown-sourcecode-2.png)

Dubbo发现程序退出的时候，钩子方法会通知注册中心取消自身的注册——以便告知消费者不要调用自己了，然后关闭自身的端口连接——在关闭自身连接的时候还会sleep自旋的方法等待已有的处理请求先完成）

![img](http://jaskey.github.io/images/dubbo-shutdown-hook/dubbo-shutdown-sourcecode-3.png)



但是，Dubbo服务的优雅退出，不代表服务背后的代码是优雅的，也就是说在Dubbo优雅退出的完成前，我们的服务能否能保证可用——背后的资源/服务是否仍然可用。

本文一开始截图的错误，原因就是服务停机的时候，依赖的数据库资源因为某些原因已经回收了，这时候正在处理的请求自然报错而显得不优雅了。



而回收的人并不是别人，就是Spring的优雅退出。

# Spring的优雅退出

Spring回收资源也是基于ShutdownHook实现的，Spring在启动的时候会调用`refreshContext`接口，这个接口默认会帮我们注册优雅退出的钩子方法。

![img](http://jaskey.github.io/images/dubbo-shutdown-hook/spring-shutdown-hook-sourcecode-1.png)

![img](http://jaskey.github.io/images/dubbo-shutdown-hook/spring-shutdown-hook-sourcecode-2.png)

这个钩子方法最后会销毁Spring容器，其中自然包括其背后的依赖的资源。



因为大部分情况下，我们的Dubbo服务是依赖于Spring的资源的，要真正实现优雅退出，除了双方本身退出的过程是优雅的，还需要保证Dubbo退出的过程中Spring的资源是可用的——也就是退出应该要是有顺序的：Dubbo退出→Spring退出。

但是Java的ShutdownHook背后的退出是并发执行而没有顺序依赖的，这是背后表现不优雅的原因。以下是JDK文档的描述：

![img](http://jaskey.github.io/images/dubbo-shutdown-hook/jdk-shudownhook-coments.png)

正是由于本身应该有顺序关系的退出逻辑，在并行的处理，导致部分的流量正在处理过程中，依赖的资源已经释放了，最终导致退出的不优雅。



要解决这个问题，可简单可行的思路是：给Dubbo退出一定的时间去处理，然后再执行Spring容器的关闭。但由于钩子方法的时机并不能程序员控制，那么怎么样才能做到呢——禁用原生Spring的钩子方法，在合适的时机手动销毁Spring容器。



# 优雅退出方案（简版）——给予固定睡眠时间后才关闭Spring容器：

```java
SpringApplication application = new SpringApplication(Main.class);
application.setRegisterShutdownHook(false);//关闭spring的shutdown hook，后续手动触发
final ConfigurableApplicationContext context = application.run(args);
Runtime.getRuntime().addShutdownHook(new Thread("T_SHUTDOWN_HOOK") {
    public void run() {
        log.info("”====================shutdown App====================“。");
        //....这里可以做其他优雅退出处理，例如回收本地线程池、关闭定时调度器等的操作

        try {
            Thread.sleep(2000);//等待一段时间，这里给时间dubbo的shutdownhook执行，
        } catch (InterruptedException e) {
            log.error("",e);
        }

        //关闭spring容器
        context.close();
    }
});

```





# 优雅退出方案（升级版）——动态地等待消费者及生产者连接关闭后才关闭Spring容器：

上面的方案正常情况下也够用，因为大部分时间我们只需要估算一个退出时间，让dubbo处理销毁的工作即可，但是对于一些退出时间相对变化较大（如有动态的消费者），表现出来的结果就是dubbo的退出时间有时候较短，有时候缺比较长。如果直接给一个较大的睡眠时间，可能使得每次程序退出都等很久，就显得不太优雅了。

那么我们就可以使用一些底层的dubbo api去确认消费者和生产者的连接已经关闭，以下是一个方法用以取代上面代码片段中的sleep的语句：

```java
/**
 * 等待Dubbo退出，优雅退出的shutdown hook可使用
 * @param sleepMillis 每次发现Dubbo没退出完就睡眠等待的毫秒数
 * @param sleepMaxTimes 最多睡眠的次数，避免一直dubbo退出太久卡住程序的退出，达到此次数后会不再等待
 */
public static void waitDubboShutdown(long sleepMillis, int sleepMaxTimes) {
    for (int sleepWaitTimes=0; sleepWaitTimes <sleepMaxTimes; sleepWaitTimes++){//如果dubbo的server没有关闭完成，会睡眠等待，最多等待三次
        Collection existingDubboServers = DubboProtocol.getDubboProtocol().getServers();
        Collection existingDubboExporters  = DubboProtocol.getDubboProtocol().getExporters();
        log.info("existing dubbo servers : {}, existing dubbo expoerters {} ,  sleepWaitTimes : {}", existingDubboServers, existingDubboExporters, sleepWaitTimes);
        if (!existingDubboServers.isEmpty() || !existingDubboExporters.isEmpty()) {
            try {
                Thread.sleep(sleepMillis);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        } else {
            break;
        }
    }

    //优雅退出失败，打印日志
    Collection existingDubboServers = DubboProtocol.getDubboProtocol().getServers();
    if (!existingDubboServers.isEmpty()) {
        log.warn("DUBBO服务Server依然存在，不再等待其销毁，可能会导致优雅退出失败 {}",existingDubboServers);
    }

    Collection existingDubboExporters  = DubboProtocol.getDubboProtocol().getExporters();
    if (!existingDubboExporters.isEmpty()) {
        log.warn("DUBBO服务Exporters依然存在，不再等待其销毁，可能会导致优雅退出失败 {}",existingDubboExporters);
    }
}
```


注：这个方法用到了DubboProtocol的底层API，所以如果你的协议不是使用"dubbo"而是如HTTP协议、redis协议，则此方法不可用。关于协议的部分，可以参考官方文档：http://dubbo.apache.org/zh-cn/docs/user/references/protocol/introduction.html



那么最后，升级版的优雅退出代码则如下所示：

```java
SpringApplication application = new SpringApplication(Main.class);
application.setRegisterShutdownHook(false);//关闭spring的shutdown hook，后续手动触发
final ConfigurableApplicationContext context = application.run(args);
Runtime.getRuntime().addShutdownHook(new Thread("T_SHUTDOWN_HOOK") {
    public void run() {
        log.info("”====================shutdown App====================“。");
        //....这里可以做其他优雅退出处理，例如回收本地线程池、关闭定时调度器等的操作

        waitDubboShutdown(1000,5);//每次等1000ms，最多等5次；优雅退出时间是动态的（可能1秒就能优雅退出完毕）；但如果退出时间大于5秒，那么则放弃优雅退出，直接退出。

        //关闭spring容器
        context.close();
    }
});
```

