---
layout: post
title: "Python中用dictionary操作SQL select, insert"
date: 2015-05-07 16:19:49 +0800
comments: true
categories: Python
---

MySQLdb中可以轻松地使用dictionary操作SQL。

首先，连接数据库

    conn = MySQLdb.connect(host=host,
                           user=user,
                           passwd=passwd,
                           db=db,
                           charset=charset)


#SELECT:
在获取cursor的时候，传入`MySQLdb.cursors.DictCursor`即可

    cursor = conn.cursor(MySQLdb.cursors.DictCursor)  ##结果集成为dictionary
    cursor.execute(select_sql )  # query

	for row in cursor:
		print type(row),row
    	name = row["name"]  # 直接使用key获取
    	id = row["id"]      # 直接使用key获取
    
会发现,row的类型已经是一个dict, 其中每一列都可以使用key值获取
    <type 'dict'> {id:123L,'name':u'abc' }


#INSERT

如果需要把一个准备好的dict插入到数据库，不想一个个对应的赋值，可以考虑使用如下方式:
	
	myDict = {'name':'abc','age':16L}
	insert_table = 'mytable'
	placeholders = ', '.join(['%s']* len(mydict))  ##按照dict长度返回如：%s, %s 的占位符
	columns = ', '.join(mydict.keys())    ##按照dict返回列名，如：age, name
	insert_sql =  "INSERT INTO %s ( %s ) VALUES ( %s )" % (insert_table, columns, placeholders) #INSERT INTO mytable ( age, name ) VALUES ( %s, %s )

	cursor.execute(insert_sql, mobileDict.values())  ##执行SQL,绑定dict对应的参数

