---
layout: post
title: "cookie 与 session的区别"
date: 2014-09-24 18:20:05 +0800
comments: true
categories: stackovergiant cookie session
---

我们有时候会对于`cookie`和`session`糊涂，因为总的来说，他们都是保存用户信息的，而有时候我们在浏览器中选择“delete cookies”的时候，为什么session就没了呢？感觉这两个东西是不是一样的？

其实不是。

`session`是服务端的文件用于存储用户信息，而`cookie`是存储用户信息的客户端文件。

`cookie`是一个短的字符串，用于在客户端和服务端来回发送。我们可以保存类似于name=bob&password=asdf在cookie然后在两端来回发送。
这样做就像，去银行办业务，而银行的业务员极为健忘，然后他需要我们每次进行交易的时候都出示身份。当然，如果我们用cookie取存储这种敏感的信息的话是极为不安全的，而且cookie本身也有大小的限制。

那么，如果这个业务员意识到了自己的健忘病，他可以在纸上记下你的相关信息然后递给你一个号码，然后以后你再办业务的时候你就可以简单的说
“我是12号客户”，这样就不需要每次都出示身份证啊，银行个人账号去标识自己了。

对应着在Web服务器，服务器会记录相关的信息在一个`session`对象，然后创建一个`session ID`然后发送给客户端保存在`cookie`中。当客户端发送这个cookie回来的时候，服务端就能简单的用`session ID`去查找`session`对象。

所以，如果我们删除了`cookie`(如在浏览器中清空历史记录)，这个`session`就丢失了。

还有一种方法是，用URL来交换`session id`，例如有一个link www.myserver.com/myApp.jsp, 然后我们可以重写每一个url让他成为类似于www.myserver.com/myApp.jsp?sessionID=asdf 甚至even www.myserver.com/asdf/myApp.jsp 用于标识`session id`。


更多解析，可参考stackoverflow:
[Differences between cookies and sessions?](http://stackoverflow.com/questions/359434/differences-between-cookies-and-sessions)