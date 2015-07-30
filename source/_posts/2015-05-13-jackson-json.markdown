---
layout: post
title: "Jackson 操作JSON"
date: 2015-05-13 21:18:28 +0800
comments: true
categories: JSON Java
---

## Maven 支持：##
      <repositories>
    	<repository>
    		<id>codehaus</id>
    		<url>http://repository.codehaus.org/org/codehaus</url>
    	</repository>
      </repositories>
     
      <dependencies>
    	<dependency>
    		<groupId>org.codehaus.jackson</groupId>
    		<artifactId>jackson-mapper-asl</artifactId>
    		<version>1.8.5</version>
    	</dependency>
      </dependencies>


需要进行JSON操作的转换，仅需要一个`ObjectMapper`对象
	ObjectMapper mapper = new ObjectMapper();

转换为对象时候，使用`read`相关方法，转换为JSON字符串时，使用`write`相关方法。


## Java object to JSON ##

	ObjectMapper mapper = new ObjectMapper();
	mapper.writeValue(new File("c:\\user.json"), user);//写到文件,User 有get set 方法的POJO

大多数情况下，我们只需要一个JSON字符串，可以使用`StringWriter`作为参数的重载的`writeValue`方法：

    
	StringWriter sw =new StringWriter();
    ObjectMapper mapper = new ObjectMapper();
    mapper.writeValue(sw, user);//写到StringWriter
    String JSON = sw.toString();
    sw.close();



也可以直接使用`writeValueAsString` ，其内部使用的也是`StringWriter`的。


	ObjectMapper mapper = new ObjectMapper();
    String JSON  = mapper.writeValueAsString(user));//直接转为String 类型的JSON

## JSON to Java object ##
	ObjectMapper mapper = new ObjectMapper();
	User user = mapper.readValue(new File("c:\\user.json"), User.class);//User 有get set 方法的POJO


# 集合操作 #

##Map/List to JSON##

和普通对象一样，使用(同样，可以使用重载方法)
	
	objectMapper.writeValue(new File(jsonFilePath), mapObject);
	objectMapper.writeValue(new File(jsonFilePath), listObject);
	
##JSON to Map/List/数组##

	     Map<String, Object> mapObject = mapper.readValue(new File('c:\\user.json'),
                    new TypeReference<Map<String, Object>>() {});//使用TypeReference, 注意末尾有{}



	     List<String> listObject = mapper.readValue(new File('c:\\user.json'),
                    new TypeReference<List<String>(){});//使用TypeReference, 注意末尾有{}


	     String[] array = mapper.readValue(new File('c:\\user.json'),
                    String[].class);//使用class对象
	