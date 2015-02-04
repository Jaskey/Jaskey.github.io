---
layout: post
title: "untrace .gitignore中已经被commit的文件"
date: 2014-12-03 11:35:01 +0800
comments: true
categories: git 
---


很可能在添加忽略文件到.gitignore之前，你已经commit过那些文件，如何把这些提交了的文件忽略并且不在本地删除这些文件，让`.gitignore`生效，以下是步骤

1. 确保你现在branch上的重要文件已经commit.
2. 在项目根路径运行：

		git rm -r --cached .
3. 然后从staging area中移除所有已经改变的文件:
	
		git add .

4. 最后再提交即可

		git commit -m ".gitignore is working, fixed untracked files"