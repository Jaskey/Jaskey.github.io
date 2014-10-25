---
layout: post
title: "什么时候应该使用“静态类”而不使用单例？"
date: 2014-09-24 20:26:02 +0800
comments: true
categories: stackovergiant java 单例
---

经常我们都会使用单例，而有时候我们又会贪图方便而使用一个类然后全部都使用静态方法。那么，到底什么时候我们才应该使用这种都是静态方法的类呢(注：java没有静态类)？

1. 所有方法都是一些工具类的方法，如`Math`类
2. 不希望被gc回收又不想自己去处理实例。
3. 很确定这个类将来也不会是有状态的（stateful）而且你确定你不需要多个实例。

注：

如果我们使用单例模式的话，将来假如我们需要多个实例，将非常轻松的改变，但是使用static方法的类就不行。而且使用单例的话，将很好地利用继承、多态等方法。


stackoverflow相关讨论：



- ["Advantage of Static class over use of Singleton"](http://stackoverflow.com/questions/839383/advantage-of-static-class-over-use-of-singleton/ )
- ["Difference between singleton class and static class?"](http://stackoverflow.com/questions/3714971/difference-between-singleton-class-and-static-class)


