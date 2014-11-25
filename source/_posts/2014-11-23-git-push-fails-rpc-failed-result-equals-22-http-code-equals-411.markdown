---
layout: post
title: "git push error: RPC failed; result=22, HTTP code = 411 解决方案"
date: 2014-11-23 23:10:43 +0800
comments: true
categories: git 
---

有时候git push 会报类似的错误，如在BAE上push一个项目较大的时候，可能就会报此错误。由于遇到很多次，今天记录下解决方法：

默认情况下，Git设置了HTTP操作的最大值为一MB，所以当你push代码的时候如果超过这个值，则可能发生错误。

解决方法如下：

1. 进入git 目录
2. 扩大允许的最大值：

		git config http.postBuffer *bytes*

如：扩大到500MB:

		git config http.postBuffer 524288000

再次push，问题应该就解决了。