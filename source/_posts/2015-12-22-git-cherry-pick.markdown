---
layout: post
title: "git中只merge部分commit"
date: 2015-12-22 16:12:38 +0800
comments: true
categories: git 
description: git中只merge部分commit
keywords: git , merge, commit, cherry-pick
---

##cherry-pick##
在Git 1.7.2以上的版本引入了一个 cheery-pick的命令可以只merge 部分的commit而不用直接把整个分支merge过来

	git cherry-pick <commit 号>
   
如：

 	git cherry-pick e43a6fd3e94888d76779ad79fb568ed180e5fcdf

这样就只会把这个`e43a6fd3e94888d76779ad79fb568ed180e5fcdf` commit的内容pull到当前的分支，不过你会得到一个新的commit。
这样就可以按需merge需要的commit,而不需要的就可以直接废弃咯。

###多个commit:###

可以用空格指定多个commit:

	git cherry-pick A B C D E F


<!--more-->

##范围merge:##

`cherry-pick`可以范围merge ,使用 两次版本间使用`..`连起来：

	cherry-pick A..B


这样会把从从版本A（不包含）到B（包含）即（A，B]的版本pull到当前分支

甚至，可以使用多段，同样使用空格隔开：

	git cherry-pick A..B C..D E..F



注：中间需要自己解决冲突，若出现冲突，可以尝试使用 `git mergetool` 使用GUI工具解决