---
layout: post
title: "谈谈Java同步机制"
date: 2014-10-13 21:11:20 +0800
comments: true
categories: java
---


在多线程中，有两个核心的问题需要解决。一个是多个线程对于资源的竞争问题，我们需要同步，另外一个则是多个线程之间的交互。
今天简单谈谈Java的同步机制。

我们以一个十分简单的例子讲起。

	int i=0
	public int getNextI(){
		return ++i;
	}


这是一个极为简单的方法，但是在多线程的环境中则增加了许多其他复杂的因素。

首先，++i不是一个原子操作。进行i+1的操作，是分多步的，最后重新赋值写给i。

其次，在多线程的环境中，每个线程都会有一个working memory, 所以如果我们启动一个新线程操作`getNextI()`，i的操作是出现在working memory 中的，最后操作完成后一段时间才会重新写入main memory.


这样第一个问题就是，如何保证i的可见性。也就是说，假如两个线程T1，T2。T1对i进行操作后把i变成了2，但在T1把2这个值写入main memory之前，T2是读取不到2这个值的，也就是说他读到的是老的数据。


##volatile##

这时候，我们就可以把i用`volatile`修饰。 `volatile`的变量，线程不会复制到working memory，而是直接在main memory上操作。

`volotile`特别适用于多线程环境中某个循环的结束条件。 如 `while(condition){//do someting}`, 这里面的condition应该声明为volatile，这样每一个线程对condition的修改都会立刻被其他线程读取到。

##synchronized##

`volatile`只能保证变量的可见性，并不能保证i++的原子性。如果我们需要串行化的处理这个方法，我们需要谨慎使用volatile，而使用`synchronized`。

假如T1,T2同时进入`getNextI()`,然后T1和T2都读到了1，然后分别的进行++i,最后有可能i只是变成了2。我们希望T1和T2是有秩序的访问这个方法，这时候我们要使用到Synchronized机制了。


我们可以改成 	
	
	public synchronized int getNextI(){
		return i++;
	}

这样在每个线程进入`getNextI()`之前，都会尝试去获取当前对象的intrinsic锁，并且只有一个线程可以获取。当结束该方法时候，就会释放，这样其他线程就可以获取到，这样就可以就可以保证T1和T2对方法操作是串行的。

注：
如果当前方法为静态方法，则锁是打在当前类的Class对象，而非对象本身。所以静态方法的控制和实例方法的控制是区分开来的。


但有些时候整个方法都加锁会影响性能，因为我们可能很多操作都不涉及共享资源，也就没有资源竞争的问题存在，所以synchronized 除了可以修饰方法，还可以修饰一段代码块，以便最小粒度的限制加锁的范围。当修饰代码块时候，必须要指定获取intrinsic锁的对象。如：

	public  int getNextI(){
		synchronized(this){
			return i++;
		}
	}



更多文档可参考：

http://docs.oracle.com/javase/tutorial/essential/concurrency/locksync.html