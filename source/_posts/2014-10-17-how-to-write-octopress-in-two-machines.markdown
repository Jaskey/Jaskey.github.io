---
layout: post
title: "如何在两台机器上使用octopress"
date: 2014-10-17 00:55:09 +0800
comments: true
categories: octopress 
---

在现在云端时代，在多台机器上操作同一份文档是十分常见的需求。而需要多台机器上使用octopress,git提供了很好的支持。今天分享下如何使用git在多台机器上使用octopress.


## 准备工作： ##
和  [之前写的“如何开始使用octopress”](http://jaskey.github.io/blog/2014/09/04/how-to-octopress/)一样，要先安装相应的软件

1. [安装Git](http://git-scm.com/)
1. 安装ruby,例如：[Ruby 1.9.3-p194](http://rubyforge.org/frs/download.php/76054/rubyinstaller-1.9.3-p194.exe),并配置环境变量PATH 到rubyhome/bin
1. 安装[ Development Kit](http://rubyinstaller.org/downloads/).如 [DevKit-tdm-32-4.5.2-20111229-1559-sfx.exe](https://github.com/downloads/oneclick/rubyinstaller/DevKit-tdm-32-4.5.2-20111229-1559-sfx.exehttps://github.com/downloads/oneclick/rubyinstaller/DevKit-tdm-32-4.5.2-20111229-1559-sfx.exe) and 解压到文件夹 C:/RubyDevKit.
1. 建立一个文件夹，例如在C：/github 




#克隆项目#


接下来我们需要把已经建好的博客项目clone下来。

##克隆source分支##

	$ git clone -b source git@github.com:username/username.github.com.git octopress ##octopress 为你的项目文件夹

##克隆master分支##
	
	$ cd octopress ##进入项目
	$ git clone git@github.com:username/username.github.com.git _deploy ##克隆master分支到_deploy 


#配置环境#

	$ gem install bundler
	$ rbenv rehash    # If you use rbenv, rehash to be able to run the bundle command
	$ bundle install
	$ rake setup_github_pages

然后它会询问你的项目仓库的URL:
> Enter the read/write url for your repository
> (For example, 'git@github.com:your_username/your_username.github.com)

输入仓库的URL，这样你就完成了全新的一个本地博客副本。

#更新变化（重要）#

	$ cd octopress  #进入项目目录
	$ git pull origin source  # 更新本地source branch
	$ cd ./_deploy  #进入_deploy目录
	$ git pull origin master  # 更新本地master branch



#提交#
提交的时候，由于需要多台机器协作，需要把source分支push到origin中，这样另外一台机器才能拿到最新的源文件。

	$ rake generate
	$ git add .
	$ git commit -am "提交评论" 
	$ git push origin source  # 更新远程 source branch 
	$ rake deploy             # 更新远程 master branch，并部署博文



#另外的机器更新变化#
在另外的机器上，就可以获取到相应的变化。

	$ cd octopress  #进入项目目录
	$ git pull origin source  # 更新本地source branch
	$ cd ./_deploy  #进入_deploy目录
	$ git pull origin master  # 更新本地master branch
