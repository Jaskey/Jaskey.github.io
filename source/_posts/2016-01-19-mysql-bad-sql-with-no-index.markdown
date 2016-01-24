---
layout: post
title: "避免写出不走索引的SQL, MySQL"
date: 2016-01-19 20:24:16 +0800
comments: true
categories: MySQL SQL
keywords: MySQL , SQL, 索引, innodb, SQL优化, 数据库优化, 数据库
description: MySQL中哪些SQL不走索引
---



在MySQL中，并不是你建立了索引，并且你在SQL中使用到了该列，MySQL就肯定会使用到那些索引的，有一些情况很可能在你不知不觉中，你就“成功的避开了”MySQL的所有索引。


现假设有`t_stu`表，age,sname上建立了索引


###索引列参与计算###

如果where条件中`age`列中使用了计算，则不会使用该索引

	SELECT `sname` FROM `t_stu` WHERE `age`=20;-- 会使用索引
	SELECT `sname` FROM `t_stu` WHERE `age`+10=30;-- 不会使用索引！！因为所有索引列参与了计算
	SELECT `sname` FROM `t_stu` WHERE `age`=30-10;-- 会使用索引

故，如果需要计算，千万不要计算到索引列，想方设法让其计算到表达式的另一边去。


###索引列使用了函数###

同样的道理，索引列使用了函数，一样会导致相同的后果

	SELECT `sname` FROM `stu` WHERE concat(`sname`,'abc') ='Jaskeyabc'; -- 不会使用索引,因为使用了函数运算,原理与上面相同
	SELECT `sname` FROM `stu` WHERE `sname` =concat('Jaskey','abc'); -- 会使用索引



###索引列使用了Like %XXX###

	SELECT * FROM `houdunwang` WHERE `uname` LIKE '前缀就走索引%' -- 走索引
	SELECT * FROM `houdunwang` WHERE `uname` LIKE '后缀不走索引%' -- 不走索引

所以当需要搜索email列中.com结尾的字符串而email上希望走索引时候,可以考虑数据库存储一个反向的内容reverse_email

	SELECT * FROM `table` WHERE `reverse_email` LIKE REVERSE('%.com'); -- 走索引

注：以上如果你使用`REVERSE(email) = REVERSE('%.com')`，一样得不到你想要的结果，因为你在索引列email列上使用了函数，MySQL不会使用该列索引


同样的，索引列上使用正则表达式也不会走索引。



###字符串列与数字直接比较###

这是一个坑，假设有一张表,里面的a列是一个**字符char类型**,且a上建立了索引,你用它与数字类型做比较判断的话：

     CREATE TABLE `t1` (`a` char(10));

	 SELECT * FROM `t1` WHERE `a`='1' -- 走索引
	 SELECT * FROM `t2` WHERE `a`=1 -- 字符串和数字比较，不走索引！


但是如果那个表那个列是一个数字类型，拿来和字符类型的做比较，则不会影响到使用索引

     CREATE TABLE `t2` (`b` int);

	 SELECT * FROM `t2` WHERE `b`='1' -- 虽然b是数字类型，和'1'比较依然走索引


但是，无论如何，这种额外的隐式类型转换都是开销，而且由于有字符和数字比就不走索引的情况，故建议**避免一切隐式类型转换**




###尽量避免 OR 操作###

	select * from dept where dname='jaskey' or loc='bj' or deptno=45 --如果条件中有or,即使其中有条件带索引也不会使用。换言之,就是要求使用的所有字段,都必须建立索引

所以除非每个列都建立了索引，否则不建议使用OR，在多列OR中，可以考虑用UNION 替换

	select * from dept where dname='jaskey' union
	select * from dept where loc='bj' union
	select * from dept where deptno=45



