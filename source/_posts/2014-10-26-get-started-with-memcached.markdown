---
layout: post
title: "快速入门Memcached"
date: 2014-10-26 00:41:53 +0800
comments: true
categories: memcached
---

最近学习Memcahced,使用了一天时间搭建了memcached的集群，并使用memcached的客户端`spymemcached`成功访问到集群。今天整理下学习的笔记。

##Linux下安装Memcached##

以`Ubuntu`为例。

1.更新本地仓库

	sudo apt-get update

2.安装`memcached Service`

	sudo apt-get install memcached

3.安装成功后，使用`ps aux | grep memcached`可检查`memcached`服务是否已启动。你可能会看到类似下面的信息，证明memcached服务已经启动。

	memcache  1027  0.0  0.1  46336  1080 ?        Sl   00:38   0:00 /usr/bin/memcached -m 64 -p 11211 -u memcache -l 0.0.0.0
	jaskey    2477  0.0  0.0   4372   832 pts/1    S+   00:49   0:00 grep --color=auto memcached



注：默认情况下，memcached的服务进程只在默认的localhost监听。所以如果我们需要从其他机器访问该服务，需要修改监听的ip

##修改memcached服务监听地址##
打开配置文件：`memcached.conf`(在/etc下)

	# Specify which IP address to listen on. The default is to listen on all IP addresses
	# This parameter is one of the only security measures that memcached has, so make sure
	# it's listening on a firewalled interface.
	-l 127.0.0.1

找到相关-l 的配置，修改为`0.0.0.0`即可

其余重要还有-m(内存大小)，-p(默认端口号)

	# Start with a cap of 64 megs of memory. It's reasonable, and the daemon default
	# Note that the daemon will grow to this size, but does not start out holding this much
	# memory
	-m 64
	
	# Default connection port is 11211
	-p 11211


##使用telnet与memcached通信##

1.首先，安装telnet客户端

	sudo apt-get install telnet
	
2.使用telnet访问

	telnet localhost 11211

其中11211为memcached默认端口。

如果你能看到类似以下的输出，则证明访问成功。

	Trying 127.0.0.1...Connected to localhost.Escape character is '^]'.

我们可以使用`stats`命令获得memcached的基本信息

	Trying 127.0.0.1...
	Connected to localhost.
	Escape character is '^]'.
	stats
	STAT pid 1027
	STAT uptime 1487
	STAT time 1414256583
	STAT version 1.4.13
	STAT libevent 2.0.16-stable
	STAT pointer_size 32
	STAT rusage_user 0.040002
	STAT rusage_system 0.252015
	STAT curr_connections 5
	STAT total_connections 6
	STAT connection_structures 6
	STAT reserved_fds 20
	STAT cmd_get 0
	STAT cmd_set 0
	STAT cmd_flush 0
	STAT cmd_touch 0
	STAT get_hits 0
	STAT get_misses 0
	STAT delete_misses 0
	STAT delete_hits 0
	STAT incr_misses 0
	STAT incr_hits 0
	STAT decr_misses 0
	STAT decr_hits 0
	STAT cas_misses 0
	STAT cas_hits 0
	STAT cas_badval 0
	STAT touch_hits 0
	STAT touch_misses 0
	STAT auth_cmds 0
	STAT auth_errors 0
	STAT bytes_read 7
	STAT bytes_written 0
	STAT limit_maxbytes 67108864
	STAT accepting_conns 1
	STAT listen_disabled_num 0
	STAT threads 4
	STAT conn_yields 0
	STAT hash_power_level 16
	STAT hash_bytes 262144
	STAT hash_is_expanding 0
	STAT expired_unfetched 0
	STAT evicted_unfetched 0
	STAT bytes 0
	STAT curr_items 0
	STAT total_items 0
	STAT evictions 0
	STAT reclaimed 0
	END
	
	
##往memcached存储/获取值##

使用`add`命令

	add newkey 0 60 5
	abcde

如果现实STORED则为存储成功:

然后就可以使用`get newkey`获取到这个存储的值了。

	get newkey
	VALUE newkey 0 5
	abcde
	END



**命令解析**：

	<command name> <key> <flags> <exptime> <bytes>

常用command name 有 `add` , `set`,  `replace`, `append`。

`flags`

是一个16为无符号整形，memcached server会把这个flags和key一起存储起来，并且访问该key的时候，也会返回这个`flags`。我们可以根据需要设置这个key的格外信息。

`exptime`

值超时的时间，单位为秒。如果设置为0，则不会超时。

`bytes`

存储的值的大小，在我们这个例子，由于我们需要存储abcde,所以我们设置改参数为5。



----------

## 建立分布式memcached集群 ##


到此为止，我们已经可以访问到默认启动的memcached服务了，但是实际上我们需要一个memcached集群。我们可以在多台机器上启动memcached服务，这样就可以获取一个无限制内存大小的缓存服务。然后使用memcached客户端连接上去。

鉴于在学习阶段，我们可以尝试在不同的端口上启动memcached，然后获得一个本地集群。

启动memcached:
	memcached -d -l 0.0.0.0 -m 64 -p 12122

其中`-d`参数表示启动为daemon, -l 指定监听ip，-p监听端口，-m指定服务的内存大小。

然后使用`ps aux |grep memcached`确认端口的确运行成功。

## 使用memcached客户端 ##

memcached的守护进程是对不知道集群的存在和server设置的。实际上，是memcached client把数据分布式的存储在不同memcached服务上。所以，同一份存储的数据，你只能在一个memcached服务中访问，其他的memcached都无法获得。



我们这里以java语言作为例子，演示如何使用java访问memcached server。这里使用的是`spymemcached`这个memcached client。

在`maven`中添加spymemacached依赖：

	<dependency>
		<groupId>net.spy</groupId>
		<artifactId>spymemcached</artifactId>
		<version>2.10.1</version>
	</dependency>


代码示例如下：
	
	public class MemcachedDemo 
	{
	
		static final  InetSocketAddress[] servers=new InetSocketAddress[]{	//创建好需要连接的memcached集群的ip和端口
			new InetSocketAddress("192.168.56.101",11211),
			new InetSocketAddress("192.168.56.101",11212)
		};
	
	    public static void main( String[] args ) throws IOException{
	        System.out.println( "Begin memcached" );
	        MemcachedClient client=new MemcachedClient(servers);//建立memcached client对象连接到集群，注：spymemcahced,会处理重新连接
	        

			//存储两个对象，一个String类型，一个自定义对象（需要实现Serializable接口）
	        client.set("city", 60, "shenzhen");//expired in 60 seconds
	        System.out.println( "city is set" );
	        client.set("emp", 0, new Employee("jaskey", 23));//never expired,注：Employee对象需要实现java.io.Serializable接口        
	       
			//从memcached server中获取对象
	        Employee empFromServer=(Employee)client.get("emp");
	        String city=(String)client.get("city");

	        System.out.println("emp from memcached: "+empFromServer);
	        System.out.println("city from memcached: "+city);
	        
			client.shutdown();
		    }
	}


输出：

	Begin memcached
	2014-10-26 01:56:51.431 INFO net.spy.memcached.MemcachedConnection:  Added {QA sa=/192.168.56.101:11211, #Rops=0, #Wops=0, #iq=0, topRop=null, topWop=null, toWrite=0, interested=0} to connect queue
	2014-10-26 01:56:51.435 INFO net.spy.memcached.MemcachedConnection:  Added {QA sa=/192.168.56.101:11212, #Rops=0, #Wops=0, #iq=0, topRop=null, topWop=null, toWrite=0, interested=0} to connect queue
	2014-10-26 01:56:51.443 INFO net.spy.memcached.MemcachedConnection:  Connection state changed for sun.nio.ch.SelectionKeyImpl@72a7d24a
	emp is set
	emp from memcached: Employee("jaskey", 23)
	city from memcached: shenzhen
	2014-10-26 01:56:51.492 INFO net.spy.memcached.MemcachedConnection:  Shut down memcached client
	
	
其中，get操作是同步的，如果希望使用异步get，可以使用`asyncGet`方法返回一个`Future`对象：

        Future<Object> fobject = client.asyncGet("emp");
        try {
			Employee emp=(Employee)fobject.get(10, TimeUnit.SECONDS);//设置10秒的延迟
			System.out.println("emp from memcached"+emp);
        } catch (InterruptedException e) {
			e.printStackTrace();
		} catch (ExecutionException e) {
			e.printStackTrace();
		} catch (TimeoutException e) {
			e.printStackTrace();
		}
        	
	

##关于集群

如果这时候，你使用telnet命令分别访问不同的memcached服务，你很可能发现emp这个值只存在于其中的一个服务，而其他服务是获取不到的。

这样证明一份数据只被保存了一遍，然而对于客户端而言，具体保存在哪里却是完全透明的，因为spymemcahced把这个数据映射的工作做了。

这样我们就好像操作一份很大内存空间的缓存一样，而实际上，我们是对分布在不同memcached 服务的内存空间在进行操作。	
