---
layout: post
title: "Maven 配置 BAE SDK"
date: 2014-11-25 23:38:51 +0800
comments: true
categories: BAE maven
---

百度BAE的官方文档没有一个完整的使用Maven配置BAE SDK的例子，而[BAE官方博客](http://godbae.duapp.com/?p=366)上的配置也不可用。

经过多日的调试和BAE客服的交流，最后成功配置出了一个maven 配置的 pom.xml文件。今天决定分享一下，可能是现在网上能搜到的第一篇可用的配置步骤了。

1.建立Maven项目

2.下载BAE SDK 这里使用的是[baev3-sdk-1.0.1](http://bcs.duapp.com/baev3-sdk/java-runtime/baev3-sdk-1.0.0.zip)（下载还是必须的）

3.添加如下repository 到pom.xml中

	<repositories>
	   <repository>
	        <id>bae</id>
	        <url>http://maven.duapp.com/nexus/content/groups/public/</url>
	        <releases>
	            <enabled>true</enabled>
	        </releases>
	   </repository>
	</repositories>

4.添加依赖包：

		<!-- ===================bae=============================== -->
		
 		<dependency>
			<groupId>junit</groupId>
			<artifactId>junit</artifactId>
			<version>3.8.1</version>
			<scope>test</scope>
		</dependency>
		
    	<dependency>
			<groupId>com.baidu.bae</groupId>
			<artifactId>baev3-sdk</artifactId>
			<version>1.0.1</version>
		</dependency>
		
     	<dependency>
        	<groupId>com.baidu</groupId>
        	<artifactId>mcpack</artifactId>
        	<version>1.0.9</version>
    	</dependency>
 
		<dependency>
			<groupId>org.apache.thrift</groupId>
			<artifactId>libthrift</artifactId>
			<version>0.9.1</version>
		</dependency>
		
		<dependency>
			<groupId>com.google.code.gson</groupId>
			<artifactId>gson</artifactId>
			<version>2.2.2</version>
		</dependency>
		
		<dependency>
			<groupId>net.sf.ezmorph</groupId>
			<artifactId>ezmorph</artifactId>
			<version>1.0.6</version>
		</dependency>
		
		 <dependency>
	        <groupId>net.sf.json-lib</groupId>
	        <artifactId>json-lib</artifactId>
	        <version>2.4</version>
	        <classifier>jdk15</classifier>
    	</dependency>
    	
		<dependency>
			<groupId>commons-beanutils</groupId>
			<artifactId>commons-beanutils</artifactId>
			<version>1.8.0</version>
		</dependency>
		
    	<dependency>
        	<groupId>org.apache.httpcomponents</groupId>
        	<artifactId>httpmime</artifactId>
        	<version>4.2</version>
    	</dependency>

    	<dependency>
        	<groupId>org.apache.httpcomponents</groupId>
        	<artifactId>httpcore</artifactId>
        	<version>4.2</version>
        	<type>jar</type>
    	</dependency>

    	<dependency>
        	<groupId>org.apache.httpcomponents</groupId>
        	<artifactId>httpclient</artifactId>
        	<version>4.2.5</version>
    	</dependency>

    	<dependency>
			<groupId>commons-codec</groupId>
			<artifactId>commons-codec</artifactId>
			<version>1.6</version>
		</dependency>
		
    	<dependency>
        	<groupId>commons-io</groupId>
        	<artifactId>commons-io</artifactId>
        	<version>1.4</version>
    	</dependency> 
    	
		<dependency>
			<groupId>commons-lang</groupId>
			<artifactId>commons-lang</artifactId>
			<version>2.5</version>
		</dependency>
		
		<dependency>
			<groupId>org.apache.commons</groupId>
			<artifactId>commons-lang3</artifactId>
			<version>3.1</version>
		</dependency>	
		
		<!-- Log4j -->
		<dependency>
			<groupId>log4j</groupId>
			<artifactId>log4j</artifactId>
			<version>1.2.17</version>
		</dependency>
		
		<dependency>
			<groupId>org.slf4j</groupId>
			<artifactId>slf4j-api</artifactId>
			<version>1.7.5</version>
		</dependency>
		
		<dependency>
			<groupId>org.slf4j</groupId>
			<artifactId>slf4j-simple</artifactId>
			<version>1.7.5</version>
		</dependency>	

5.到这一步，你可能会发现如下错误：

	Missing artifact com.baidu:mcpack:jar:1.0.0.9

这时候，去到下载的BAE SDK下载的dependencies目录下，找到`mcpack-1.0.0.9.jar`

在cmd命令行中使用如下命令（需要配置好maven的环境变量）：

	mvn install:install-file -Dfile=下载路径\baev3-sdk-1.0.1\dependencies\mcpack-1.0.0.9.jar -DgroupId=com.baidu -DartifactId=mcpack -Dversion=1.0.9 -Dpackaging=jar

![安装mcpack到本地路径](/images/bae/install_mcpack.jpg "安装mcpack到本地路径")

然后去本地repo下查看是否存在此依赖包（默认在window用户目录下.m2）去查看本地安装的mcpack包。

![查看mcpack是否安装成功](/images/bae/repo_mcpack.jpg "查看mcpack是否安装成功")

6.更新maven 项目，应该就可以了。


##测试分布式日志##

在`log4j.properties`中加入如下类似配置：

	log4j.rootLogger=DEBUG,BAE
	##################分布式日志###############
	log4j.appender.BAE=com.baidu.bae.api.log.BaeLogAppender
	log4j.appender.BAE.ak=BAE的API KEY
	log4j.appender.BAE.sk=BAE的的Secrete Key
	log4j.appender.BAE.Threshold = DEBUG
	log4j.appender.BAE.layout=org.apache.log4j.SimpleLayout


maven install 并发布。在扩展服务中测试分布式日志

![测试分布式日志](/images/bae/BAE_distrubuted_logs.jpg)

如果能看到日志打印成功，则证明BAE的SDK配置成功了