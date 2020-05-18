---
layout: post
title: "Dubbo Provider中获取调用者的应用名与IP"
date: 2020-05-18 19:25:21 +0800
comments: true
categories: dubbo 
description: git中只merge部分commit
keywords: dubbo , java, filter
---





在Dubbo做微服务的架构后，对于应用请求的追踪是尤为重要的。试想一下你有一个服务在告警，但你却不知道你的请求是从哪个服务/ip上过来的，这对于问题的定位会造成极大的困难。这对于一个上游调用方多、实例多的系统来说，问题尤为明显。



本文仅讨论如何简单地用日志的形式做到追踪调用方的的应用名与IP，详细的调用链追踪是一个系统的话题，不在本文讨论。



要无缝的获取调用方的相关信息，我们可以借助Dubbo的Filter。通过在Provider端增加一个Filter做一个打印。但具体怎么获取呢？



## IP

IP的获取比较简单，我们可以在Provier端直接使用如下代码获取：

```java
String clientIp = RpcContext.getContext().getRemoteHost();//这次请求来自哪个ip
```



## 应用名

应用名则没那么容易，或许你看到过url中是有一个application的参数的，那我们是否可以使用以下代码来获取呢？

```java
String applicationFromContextUrl = RpcContext.getContext().getUrl().getParameter("application");//得到的是本应用的名字
String applicationFromInvokerURL = invoker.getUrl().getParameter(Constants.APPLICATION_KEY);//得到的也是本应用的名字
LOG.info("applicationFromUrl = {}, applicationFromInvokerURL= {}", applicationFromContextUrl, applicationFromInvokerURL);
```

答案是否定的，事实上，无论是Provider还是Consumer，当你使用这段代码获取的时候，拿到的都是本应用。



所以需要获取调用方的应用名，我们需要显示的设置进来，这里就需要增加一个Consumer的Filter，获取consumer的应用名放入attachment中带到Provider，Provider在filter中从attachment中获取即可。



Consumer Filter中传入应用名至attachment中：

```java
//手动设置consumer的应用名进attachment
String application = invoker.getUrl().getParameter(Constants.APPLICATION_KEY);
if (application != null) {
      RpcContext.getContext().setAttachment("dubboApplication", application);
}
```



Provider Filter中从其中获取调用方的应用名：

```java
String application = RpcContext.getContext().getAttachment("dubboApplication");
```





## 一对Trace Filter示意

以下是一对消费者和生产者的Filter示意，实现了以下功能：

1. Provider端记录了打印了调用方的IP和应用名

2. Consumer端打印了服务提供方的IP即本次调用的耗时



Consumer Filter：

```java
@Activate(group = Constants.CONSUMER)
public class LogTraceConsumerFilter implements Filter {

    private static final Logger LOG = LoggerFactory.getLogger(LogTraceConsumerFilter.class);

    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        //手动设置consumer的应用名进attachment
        String application = invoker.getUrl().getParameter(Constants.APPLICATION_KEY);
        if (application != null) {
            RpcContext.getContext().setAttachment("dubboApplication", application);
        }

        Result result = null;
        String serverIp = null;
        long startTime = System.currentTimeMillis();
        try {
            result = invoker.invoke(invocation);
            serverIp = RpcContext.getContext().getRemoteHost();//这次返回结果是哪个ip
            return result;
        } finally {
            Throwable throwable = (result == null) ? null : result.getException();
            Object resultObj = (result == null) ? null : result.getValue();
            long costTime = System.currentTimeMillis() - startTime;
            LOG.info("[TRACE] Call {}, {}.{}() param:{}, return:{}, exception:{}, cost:{} ms!", serverIp, invoker.getInterface(), invocation.getMethodName(), invocation.getArguments(), resultObj, throwable, costTime);
        }
    }

}
```



Provider Filter：

```java
@Activate(group = Constants.PROVIDER)
public class LogTraceProviderFilter implements Filter {

    private static final Logger LOG = LoggerFactory.getLogger(LogTraceProviderFilter.class);

    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        //上游如果手动设置了consumer的应用名进attachment，则取出来打印
        String clientIp = RpcContext.getContext().getRemoteHost();//这次请求来自哪个ip
        String application = RpcContext.getContext().getAttachment("dubboApplication");
        String from = clientIp;
        if (!StringUtils.isEmpty(application)) {
            from = application+"("+clientIp+")";
        }

        LOG.warn("[Trace]From {}, {}.{}() param:{}", from, invoker.getInterface(), invocation.getMethodName(), invocation.getArguments());
        return invoker.invoke(invocation);
    }
}
```



## Filter 文件中配置启用（注：替换对应的包名）：

```
logTraceProviderFilter=xxxx.LogTraceProviderFilter
logTraceConsumerFilter=xxxx.LogTraceConsumerFilter
```

