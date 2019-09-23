---
layout: post
title: "监控Spring Boot中的Tomcat性能数据"
date: 2019-09-23 14:56:56 +0800
comments: true
categories: 
keywords: java spring boot
description: java , spring boot
---


现在，我们经常会使用Spring Boot以开发Web服务，其内嵌容器的方法的确使得开发效率大大提升。



由于网关层通常是直接面对用户请求的一层，也是微服务里面最上游的一个服务，其请求量通常是所有服务中最大的，如果服务出现了性能上的问题，网关层通常都会出现阻塞、超时等现象，这时候就很可能需要性能的调优，其中最常见的则是参数调优。但如何知道哪些性能参数成为了瓶颈（如容器线程数是否不足等），则是调优的前提条件。

本文总结介绍如何在使用了Spring  Boot的前提下，获取运行时的Tomcat性能运行情况。

Spring Boot中有一个Spring Boot actuator的模块，用来监控和管理应用的运行状态，例如健康状况，线程运行情况等。



Maven 依赖：

```
<dependencies>
    <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```



然后当Spring Boot运行之后，Spring Boot会有很多服务暴露在http服务中，这些服务叫EndPoints， 通过 http://{应用路径}/actuator 这个 url 即可访问，例如  http://{应用路径}/actuator/info， http://{应用路径}/actuator/health 这两个endpoints是默认开启的。

其中actuator这个路径可以通过配置修改：

```
management.endpoints.web.base-path=/mypath
```



以下是获取健康状态的一个例子：

```
$ curl 'http://localhost:8080/actuator/health' -i -X GET
```

可能会得到类似这样的结果：

```
{
    "status" : "UP"
}
```

比较简陋，如果希望这个接口有更多数据，可以尝试这样的配置：

```
management.endpoint.health.show-details=always
```



结果就会丰富了（我的应用用了Redis）：类似

```
{
	"status": "UP",
	"details": {
		"diskSpace": {
			"status": "UP",
			"details": {
				"total": 214745214976,
				"free": 174805827584,
				"threshold": 10485760
			}
		},
		"redis": {
			"status": "UP",
			"details": {
				"cluster_size": 3,
				"slots_up": 16384,
				"slots_fail": 0
			}
		}
	}
}

```



但是这还不够，我们需要详细的容器数据。监控状况只是一部分。而这些我们想要的数据，是在一个叫metric的EndPoint下面。 但是此endpoint 默认没有暴露到http接口的的，需要添加配置：

```
#默认只开启info, health 的http暴露，在此增加metric endpoint
management.endpoints.web.exposure.include=info, health,metric
```



之后我们就能访问这个metric有哪些数据了

$ curl 'http://localhost:8080/actuator/metric' -i -X GET

```
{
    "names": [
        "jvm.memory.max",
        "jvm.threads.states",
        "process.files.max",
        "jvm.gc.memory.promoted",
        "tomcat.cache.hit",
        "tomcat.servlet.error",
        "system.load.average.1m",
        "tomcat.cache.access",
        "jvm.memory.used",
        "jvm.gc.max.data.size",
        "jvm.gc.pause",
        "jvm.memory.committed",
        "system.cpu.count",
        "logback.events",
        "tomcat.global.sent",
        "jvm.buffer.memory.used",
        "tomcat.sessions.created",
        "jvm.threads.daemon",
        "system.cpu.usage",
        "jvm.gc.memory.allocated",
        "tomcat.global.request.max",
        "tomcat.global.request",
        "tomcat.sessions.expired",
        "jvm.threads.live",
        "jvm.threads.peak",
        "tomcat.global.received",
        "process.uptime",
        "http.client.requests",
        "tomcat.sessions.rejected",
        "process.cpu.usage",
        "tomcat.threads.config.max",
        "jvm.classes.loaded",
        "http.server.requests",
        "jvm.classes.unloaded",
        "tomcat.global.error",
        "tomcat.sessions.active.current",
        "tomcat.sessions.alive.max",
        "jvm.gc.live.data.size",
        "tomcat.servlet.request.max",
        "tomcat.threads.current",
        "tomcat.servlet.request",
        "process.files.open",
        "jvm.buffer.count",
        "jvm.buffer.total.capacity",
        "tomcat.sessions.active.max",
        "tomcat.threads.busy",
        "process.start.time"
    ]
}
```



其中列出的是所有可以获取的监控数据，在其中我们发现了我们想要的



```
"tomcat.threads.config.max"
"tomcat.threads.current"
"tomcat.threads.busy"

```



那么如何获取其中的值呢？只需要在metric路径下加上希望获取的指标即可： curl 'http://localhost:8080/actuator/metric/tomcat.threads.busy' 



```
{
	"name": "tomcat.threads.busy",
	"description": null,
	"baseUnit": "threads",
	"measurements": [{
		"statistic": "VALUE",
		"value": 1.0
	}],
	"availableTags": [{
		"tag": "name",
		"values": ["http-nio-10610"]
	}]
}



```

在此，基本我们想要的数据都能实时的通过http服务接口的方式获取了，那么在流量峰值的时候，一些实时的状态便可获取到了。



## 监控数据

但是我们面对的情况是这样的，半个小时前，一个push活动带来了很大的量，但现在流量已经过去了，需要定位当时的性能问题意味着需要采集到过去的数据。所以我们可能需要一个服务定期去监控这些数据。Spring Boot已经考虑到了这种情况，所以其中有一个prometheus的模块，他是一个独立的服务去采集其中的监控数据并可视化，具体的介绍可以参考：https://www.callicoder.com/spring-boot-actuator-metrics-monitoring-dashboard-prometheus-grafana/



## 以日志形式定期输出监控数据

很多时候，如果有日志的方法去定期输出监控的数据这样已经足够我们分析了。在Spring Boot 2.x里，只需要配置一个Bean

```
@Configuration
class MetricsConfig {
    @Bean
    LoggingMeterRegistry loggingMeterRegistry() {
        return new LoggingMeterRegistry();
    }
}

```



之所以需要Spring Boot版本2.x，LoggingMeterRegistry是因为是micrometer-core里面的1.10以上才引入的，而Spring Boot 1.x都低于这个版本，如果不想升级Spring Boot版本，可以尝试显示变更此版本：



```
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-core</artifactId>
        <version>1.1.3</version>
    </dependency>

```

最后日志的内容就会每一分钟的打印出来：

```
jvm.buffer.count{id=direct} value=26 buffers
jvm.buffer.count{id=mapped} value=0 buffers
jvm.buffer.memory.used{id=direct} value=632.600586 KiB
jvm.buffer.memory.used{id=mapped} value=0 B
jvm.buffer.total.capacity{id=direct} value=632.599609 KiB
jvm.buffer.total.capacity{id=mapped} value=0 B
jvm.classes.loaded{} value=12306 classes
jvm.gc.live.data.size{} value=39.339607 MiB
jvm.gc.max.data.size{} value=2.666992 GiB
jvm.memory.committed{area=nonheap,id=Compressed Class Space} value=8.539062 MiB
jvm.memory.committed{area=nonheap,id=Code Cache} value=26.8125 MiB
jvm.memory.committed{area=heap,id=PS Survivor Space} value=30 MiB
jvm.memory.committed{area=heap,id=PS Eden Space} value=416.5 MiB
jvm.memory.committed{area=heap,id=PS Old Gen} value=242 MiB
jvm.memory.committed{area=nonheap,id=Metaspace} value=66.773438 MiB
jvm.memory.max{area=heap,id=PS Survivor Space} value=30 MiB
jvm.memory.max{area=heap,id=PS Eden Space} value=1.272949 GiB
jvm.memory.max{area=heap,id=PS Old Gen} value=2.666992 GiB
jvm.memory.max{area=nonheap,id=Metaspace} value=-1 B
jvm.memory.max{area=nonheap,id=Compressed Class Space} value=1 GiB
jvm.memory.max{area=nonheap,id=Code Cache} value=240 MiB
jvm.memory.used{area=nonheap,id=Code Cache} value=26.635071 MiB
jvm.memory.used{area=heap,id=PS Survivor Space} value=25.214882 MiB
jvm.memory.used{area=heap,id=PS Eden Space} value=46.910545 MiB
jvm.memory.used{area=heap,id=PS Old Gen} value=39.34742 MiB
jvm.memory.used{area=nonheap,id=Metaspace} value=63.333778 MiB
jvm.memory.used{area=nonheap,id=Compressed Class Space} value=7.947166 MiB
jvm.threads.daemon{} value=52 threads
jvm.threads.live{} value=54 threads
jvm.threads.peak{} value=67 threads
jvm.threads.states{state=terminated} value=0 threads
jvm.threads.states{state=blocked} value=0 threads
jvm.threads.states{state=new} value=0 threads
jvm.threads.states{state=runnable} value=20 threads
jvm.threads.states{state=waiting} value=19 threads
jvm.threads.states{state=timed-waiting} value=15 threads
process.cpu.usage{} value=-1
process.start.time{} value=435900h 48m 53.344s
process.uptime{} value=56m 6.709s
system.cpu.count{} value=8
system.cpu.usage{} value=-1
tomcat.global.request.max{name=http-nio-10610} value=0.597s
tomcat.servlet.request.max{name=dispatcherServlet} value=0.567s
tomcat.sessions.active.current{} value=0 sessions
tomcat.sessions.active.max{} value=0 sessions
tomcat.threads.busy{name=http-nio-10610} value=0 threads
tomcat.threads.config.max{name=http-nio-10610} value=200 threads
tomcat.threads.current{name=http-nio-10610} value=10 threads

```





如果需要修改打印的频率，可修改LoggingRegistryConfig以更改其打印频率

```
      //下面是单独的配置实现的参考，当需要修改配置时候可以使用
      return new LoggingMeterRegistry(new LoggingRegistryConfig() {
           @Override
         public Duration step() {
             return Duration.ofSeconds(10);//10秒输出一次
           }

           @Override
           public String get(String key) {
                return null;
           }
       }, Clock.SYSTEM);
    }

```

