---
layout: post
title: "谈谈性能瓶颈及简单调优"
date: 2014-10-31 17:44:25 +0800
comments: true
categories: java 性能 
---

随着系统访问量的上升，系统资源的消耗，系统的响应通常会越来越慢。这时候我们需要对系统的性能进行相关分析，找到性能瓶颈。

从代码的角度来看，性能瓶颈很可能出现在几个关键资源:CPU,内存，IO。

##CPU##

由于每个CPU的每个核一个时间只能执行一个线程，Linux采用的是抢占式的调度。


####上下文切换####

如果有频繁的上下文切换，则会造成内核占据较多的CPU使用，降低系统性能。典型的例子有是有非常强烈的锁竞争情况。这会导致当前进程频繁的进入阻塞或者休眠状态，使得应用响应下降。

这类型的解决方法有，

1. 减小Thread的数量 
2. 降低锁竞争，如分多把锁。


####线程一直处于Running####

还有另外一种情况是线程一直处于Running状态，这会导致该线程消耗大部分的CPU，通常情况是进行循环，或者大批量计算。

例如

	while(somevalue!=XXX){//
       ;//死循环
	}	

或者有一个大批量的数据操作，如对集合进行很大数据量的增加操作：

    for(int i=0;i<10000;i++){
		list.add(value[i])
	}

以上两种例子都会使得线程一直处于running状态而不释放CPU，一个可取的方法是进行部分操作后进行`Thread.sleep()`,让出CPU。

如上面第二个例子：

    for(int i=0;i<10000;i++){
       list.add(value[i])
	   if(i%50==0){//每50个就让出一次CPU	
 			Thread.sleep(1);
		}
	}

当然，对于第一个例子，假如是希望线程中的协作的话，最好使用的是monitor object 的wait()/notify()之类的方法。

如

    while(!some_condition){
		condition.wait();//挂起等待notify
	}


##内存##

如果消耗了过多的JVM Heap内存，将会频繁触发GC，将大大影响系统的性能。


####使用对象缓存池####

使用对象池可以一定程度创建对象所花费的CPU和内存


####采用合理的缓存失效算法####
上面讲到了对象池降低内存消耗，但假如放入太多对象到缓存池里面，反而会造成更严重的内存消耗，这是因为池本身对于对象持有引用，从而可能造成频繁的Full GC。所以，需要控制池中对象的数量。

当池中对象达到最大值后，如果需要加入新的对象，则需要采用合理的失效算法清除池中的对象。如FIFO,LRU,LFU。

####中途释放不用的大对象引用#####

如：

    void foo(){
   	  Object bigObject=new Object();
      bigObject.doSomething();//下面不需要了
      // 下面有很多其他耗时，耗内存的操作的话，可考虑释放bigObject的引用
      bigObject=null;

	  //some long opertions
    }


####合理使用WeakReference 和 SoftReference####

有些对象我们允许在某些情况下即使我们还有引用，也要被GC。这时候可以考虑使用弱引用或者软引用。

当某些对象用作类似缓存对象的时候，内存不足就可以被回收的话，这类对象可以使用软引用。

而当某些对象A如果依附于某个对象B存在，如果B不存在了，A就没有必要存在，并且A的存在与否不应该阻碍B是否存在，那么A引用B的时候可以考虑使用弱引用。

关于两者区别可以参考[what is the difference between a soft reference and a weak reference](http://stackoverflow.com/questions/299659/what-is-the-difference-between-a-soft-reference-and-a-weak-reference-in-java)
## 文件IO ##

文件IO严重的主要原因是多个线程在写大量的数据在同一个文件，导致文件变得很大，写入速度越来越慢，并造成线程竞争文件锁激烈。

解决此类问题的方向有：

####异步写文件####

把文件的写入操作改为异步，如写日志的时候使用`log4j`的[AsynAppender](https://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/AsyncAppender.html)

####批量读写####
如大数据插入数据库改改为批量的插入操作数据库的操作：

	  PreparedStatement ps = c.prepareStatement("INSERT INTO employees VALUES (?, ?)");
	
	  ps.setString(1, "John");
	  ps.setString(2,"Doe");
	  ps.addBatch();
	
	  ps.clearParameters();
	  ps.setString(1, "Dave");
	  ps.setString(2,"Smith");
	  ps.addBatch();
	
	  ps.clearParameters();
	  int[] results = ps.executeBatch();

具体可参考：[batch insert in java](http://viralpatel.net/blogs/batch-insert-in-java-jdbc/)
####限制文件大小####

无论数据库表，还是日志文件，我们都应该限制其的大小。

有必要的话，对于数据库表，需要分拆成小表，增加读写速度。

对于文件如日志文件则需要设置一个最大值，超过后生成另外一个新文件。如`log4j`中使用`RollingFileAppender`的`maxFileSize`属性。