---
layout: post
title: "[DUBBO] ReferenceConfig(null) is not DESTROYED when FINALIZE分析及解决"
date: 2020-05-22 18:14:58 +0800
comments: true
categories: dubbo java
keywords: dubbo, java
description: ReferenceConfig(null) is not DESTROYED when FINALIZE日志的分析及解决方案
---





最近发现经常有类似告警：

​    [DUBBO] ReferenceConfig(null) is not DESTROYED when FINALIZE，dubbo version 2.6.2



在此记录一下分析的过程和解决方案。



## 从日志定位源码位置



```java
    @SuppressWarnings("unused")
    private final Object finalizerGuardian = new Object() {
        @Override
        protected void finalize() throws Throwable {
            super.finalize();

            if (!ReferenceConfig.this.destroyed) {
                logger.warn("ReferenceConfig(" + url + ") is not DESTROYED when FINALIZE");

                /* don't destroy for now
                try {
                    ReferenceConfig.this.destroy();
                } catch (Throwable t) {
                        logger.warn("Unexpected err when destroy invoker of ReferenceConfig(" + url + ") in finalize method!", t);
                }
                */
            }
        }
    };
```



通过日志搜索源码，发现这个日志是`ReferenceConfig`类中一个`finalizerGuardian`的实例变量下复写了`finalize`而打印出来的。而从其中的源码来看，原本应该是希望做到：在发现原本的对象没有被释放资源的时候，手动回收资源。但是后面缺代码被注释了（猜测是有巨坑），就只保留了一个告警。所以实际上这个对象现在只起到了WARN日志提示的作用，并无实际作用。



注：复写`finalize`方法会导致一定的GC回收的性能问题，因为一个对象如果其中`finalize`被复写（哪怕只是写一个分号空实现），在垃圾回收的时候都会以单独的方法回收，简单说就是有一条独立的Finalizer线程（优先级很低）单独回收，如果对象分配频繁，会引起一定的性能问题。回到Dubbo的场景，假设在高并发的场景下不断创建ReferenceConfig对象，会影响这些对象的回收效率（并且这个过程中会产生一些`java.lang.ref.Finalizer`对象）甚至OOM，现在只是打印一个日志是一个不好的实践。对于finalize的原理和其对垃圾回收的影响可以参考https://blog.heaphero.io/2018/04/13/heaphero-user-manual-2/#ObjFin  ，这里摘抄其中一段供参考：



> Objects that have finalize() method are treated differently during garbage collection process than the ones which don’t have. During garbage collection phase, objects with finalize() method aren’t immediately evicted from the memory. Instead, as the first step, those objects are added to an internal queue of java.lang.ref.Finalizer. For entire JVM, there is only one low priority JVM thread by name ‘Finalizer’ that executes finalize() method of each object in the queue. Only after the execution of finalize() method, object becomes eligible for Garbage Collection. Assume if your application is producing a lot of objects which has finalize() method and low priority “Finalizer” thread isn’t able to keep up with executing finalize() method, then significant amount unfinalized objects will start to build up in the internal queue of java.lang.ref.Finalize, which would result in significant amount of memory wastage.



## 问题分析

从以上的源码上，这句日志打印的充分必要条件是：

1.ReferenceConfig被垃圾回收

2.垃圾回收的时候ReferenceConfig没有调用过destroy方法，即`!ReferenceConfig.this.destroyed`



## 代码始末

基于以上的分析，需要知道哪里我们会创建`ReferenceConfig`对象。通常情况下，这个对象我们是不会代码显示创建的，因为正常都是Dubbo基于我们的配置（注解或者配置文件）去管理内部的对象，只有我们在泛化调用的时候，可能会手动创建。



Dubbo官方文档里http://dubbo.apache.org/zh-cn/docs/user/demos/generic-reference.html  ，关于泛化调用有类似的代码，其中就会手动创建`ReferenceConfig`对象



```java
// 引用远程服务 
// 该实例很重量，里面封装了所有与注册中心及服务提供方连接，请缓存
ReferenceConfig<GenericService> reference = new ReferenceConfig<GenericService>(); 
// 弱类型接口名
reference.setInterface("com.xxx.XxxService");  
reference.setVersion("1.0.0");
// 声明为泛化接口 
reference.setGeneric(true);  

// 用org.apache.dubbo.rpc.service.GenericService可以替代所有接口引用  
GenericService genericService = reference.get(); 
 
// 基本类型以及Date,List,Map等不需要转换，直接调用 
Object result = genericService.$invoke("sayHello", new String[] {"java.lang.String"}, new Object[] {"world"}); 
 
```



由于以上代码会存在很容易导致连接等相关资源泄露等问题，详见：http://dubbo.apache.org/zh-cn/docs/user/demos/reference-config-cache.html ，所以正常的泛化调用的使用方式则变成这样：



```java
ReferenceConfig<XxxService> reference = new ReferenceConfig<XxxService>();
reference.setInterface(XxxService.class);
reference.setVersion("1.0.0");
......
ReferenceConfigCache cache = ReferenceConfigCache.getCache();
// cache.get方法中会缓存 Reference对象，并且调用ReferenceConfig.get方法启动ReferenceConfig
XxxService xxxService = cache.get(reference);
// 注意！ Cache会持有ReferenceConfig，不要在外部再调用ReferenceConfig的destroy方法，导致Cache内的ReferenceConfig失效！
// 使用xxxService对象
xxxService.sayHello();
```



Dubbo官方对于相关建议的解释是：

> `ReferenceConfig` 实例很重，封装了与注册中心的连接以及与提供者的连接，需要缓存。否则重复生成 `ReferenceConfig` 可能造成性能问题并且会有内存和连接泄漏。在 API 方式编程时，容易忽略此问题。



但是，实际上这句话和其API的实际设计上存在一定的误解。Dubbo认为`ReferenceConfig` 实例很重，所以应该缓存这个对象，所以设计了一个`ReferenceConfigCache `类，这个类实际上可以认为就是一个Map，当第一次调用cache.get(reference)的时候，实际上会把这个`ReferenceConfig` 放到里面的Map中：

```java
    public <T> T get(ReferenceConfig<T> referenceConfig) {
        String key = generator.generateKey(referenceConfig);

        ReferenceConfig<?> config = cache.get(key);
        if (config != null) {
            return (T) config.get();
        }

        cache.putIfAbsent(key, referenceConfig);
        config = cache.get(key);
        return (T) config.get();
    }
```



而`config.get()`的时候，实际上会调用内部的各种初始化的代码。



但是，这里接口设计有一个自相矛盾的地方。怎么讲了，因为“`ReferenceConfig` 实例很重”，所以，`ReferenceConfigCache `帮我们做了缓存，但是使用的时候，接口的设计却只能接受一个`ReferenceConfig` 对象，那这个对象从何而来呢？也就是说，这个缓存其实只能给Dubbo内部使用——用户给一个`ReferenceConfig` 对象给Dubbo，Dubbo判断这个对象是不是和以前的对象等价，等价的话我就不用用户传递的，用以前创建好的（因为这个对象各种资源都创建好了，没必要重复创建）。



## 原因呼之欲出

分析到这里，其实这个问题的原因已经呼之欲出了：因为泛化调用而创建了`ReferenceConfig` 对象。实际上，要复现这个问题，只需要模拟不断创建临时`ReferenceConfig` 变量然后触发GC即可：

```java
for (int i = 0; i<100000;i++) {
    new ReferenceConfig<>();
}
System.gc();//手动触发一下GC，确保上面创建的ReferenceConfig能触发GC回收
```



运行以上代码，你能发现和本文开头一模一样的告警日志。



## 为什么是ReferenceConfig(null)，即URL为什么是null？



你可能会问，上面的分析原因是清楚了，但是为什么ReferenceConfig打印的时候，url参数总是显示null? 其实上面的分析已经回答这个问题了。上面章节我们提到“而`config.get()`的时候，实际上会调用内部的各种初始化的代码。”而这个初始化的过程之一就是构建合适的url，所以当我们使用``ReferenceConfigCache `做泛化调用的时候，除了第一次创建的ReferenceConfig被`ReferenceConfigCache `缓存起来并初始化了，其他的对象其实都没有初始化过，那自然URL就是空了，同时又因为没有被缓存（所以对象在方法运行结束后不可达了）必然后面会被触发GC，那日志看起来就是ReferenceConfig(null)。



实际上分析到这里，我们可以看出这里Dubbo有两个处理不好的地方

1. API设计不合理——认为ReferenceConfig很重需要缓存，但是使用的时候必须要提供一个对象
2. ReferenceConfig回收的告警上，其实是存在优化空间的，像这种没有初始化过的对象，其实没必要打WARN日志，毕竟他没有初始化过就自然没有什么可destroy的



## 解决方案

从这里分析可以看到这行告警其实是”误报“，只要日志里url显示是null，并没有什么特殊的实际影响（在不考虑上文讲的GC问题的前提下）

```java
[DUBBO] ReferenceConfig(null) is not DESTROYED when FINALIZE，dubbo version 2.6.2
```



那如果要修复这个告警，则可考虑显示的缓存`ReferenceConfig`对象，不要每次泛化调用的时候都创建一个，可参考以下代码：



```java
    private synchronized ReferenceConfig<GenericService> getOrNewReferenceConfig(String interfaceClass) {
        String refConfigCacheKey = interfaceClass;
        WeakReference<ReferenceConfig<GenericService>> referenceConfigWeakReference = refConfigCache.get(refConfigCacheKey);

        if (referenceConfigWeakReference != null) {//缓存有弱引用
            ReferenceConfig<GenericService> referenceConfigFromWR = referenceConfigWeakReference.get();
            if (referenceConfigFromWR == null) {//证明没人引用自己被GC了，需要重建
                ReferenceConfig<GenericService> referenceConfig = newRefConifg(interfaceClass);
                refConfigCache.put(refConfigCacheKey, new WeakReference<>(referenceConfig));//放入缓存中，用弱应用hold住，不影响该有GC
                return referenceConfig;
            } else {
                return referenceConfigFromWR;
            }

        } else {//缓存没有，则创建
            ReferenceConfig<GenericService> referenceConfig = newRefConifg(interfaceClass);
            refConfigCache.put(refConfigCacheKey, new WeakReference<>(referenceConfig));//放入缓存中，用弱应用hold住，不影响该有GC
            return referenceConfig;
        }
    }
```



注：

1. 其中newRefConifg即为原先的创建`ReferenceConfig`的代码
2. 之所以使用`WeakReference`是为了保证这个缓存的对象不会影响GC——即该回收的时候还是得回收