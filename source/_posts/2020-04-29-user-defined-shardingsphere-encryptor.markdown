---
layout: post
title: "自定义ShardingSphere的加解密器"
date: 2020-04-29 20:44:03 +0800
comments: true
categories: java ShardingSphere
keywords: java , Sharding Sphere , 数据脱敏
description: 
---





默认的Sharding Sphere 支持AES和MD5两种加密器。有些时候可能需要自定义使用自己的加解密算法，如AES的具体实现不一样等。网上公开的并没有直接的指引，通过部分源码的阅读，找到了可行的方式。需要三步：





## 1.实现自定义解密器 （实现ShardingEncryptor 接口）




```java
public class TestShardingEncryptor implements ShardingEncryptor {
        private Properties properties = new Properties();

         @Override
         public String getType() {
                return "TEST";
          }


          @Override
         public void init() {

         }

         @Override
         public String encrypt(final Object plaintext) {
             return "TEST-"+String.valueOf(plaintext);
         }

         @Override
        public Object decrypt(final String ciphertext) {
             return ciphertext.replaceAll("TEST-","");
         }
}
```



其中`getType`返回的字符串（本例为"TEST"）即为本加解密器的类型（后续使用的时候会使用） 



## 2.创建org.apache.shardingsphere.spi.encrypt.ShardingEncryptor 文件



需要创建一个文件名为`org.apache.shardingsphere.spi.encrypt.ShardingEncryptor`放入resources路径下的`\META-INF\services`




![sharding-encryptor-file-path](http://jaskey.github.io/images/shardingsphere/sharding-encryptor-file-path.png "sharding-encryptor-file-path")



文件的内容就是类名全称，如：

com.yourcompany.TestShardingEncryptor



## 3.配置使用此自定义类

#### Java配置模式：

如果未使用Spring Boot，需要显示用代码配置



```java
EncryptorRuleConfiguration encryptorConfig = new EncryptorRuleConfiguration("TEST", props);

```



#### Spring Boot配置模式：

如果使用的是Spring Boot配置模式，则需要如下配置

```java
spring.shardingsphere.encrypt.encryptors.my_encryptor.type=TEST  
```

