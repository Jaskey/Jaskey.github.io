---
layout: post
title: "Windows7上配置和使用Octopress"
date: 2014-09-04 17:26:00 +0800
comments: true
categories: 
---

本文翻译自：
[setup octopress on windows 7](http://www.techelex.org/setup-octopress-on-windows7/)

----------


## 准备工作： ##
 
1. [安装Git](http://git-scm.com/)
1. 安装ruby,例如：[Ruby 1.9.3-p194](http://rubyforge.org/frs/download.php/76054/rubyinstaller-1.9.3-p194.exe),并配置环境变量PATH 到rubyhome/bin
1. 安装[ Development Kit](http://rubyinstaller.org/downloads/).如 use [DevKit-tdm-32-4.5.2-20111229-1559-sfx.exe](https://github.com/downloads/oneclick/rubyinstaller/DevKit-tdm-32-4.5.2-20111229-1559-sfx.exehttps://github.com/downloads/oneclick/rubyinstaller/DevKit-tdm-32-4.5.2-20111229-1559-sfx.exe) and 解压到文件夹 C:/RubyDevKit.
1. 建立一个文件夹，例如在C：/github 



配置Octopress:

    cd c:/github
    git clone git://github.com/imathis/octopress.git octopress #clone一个仓库，此处替换 octopress 成为 username.github.io
    cd octopress #进入clone出来的项目
    ruby --version # 应该会报出ruby 版本如 Ruby 1.9.3

然后进行相关初始化：	

    cd C:/RubyDevKit
    ruby dk.rb init
    ruby dk.rb install

安装依赖：

    cd c:/github/octopress #replace octopress with username.github.io
    gem install bundler//若出现https连接不上，到home目录下找.gemrc文件，然后在source修改https为http
    bundle install   //若需要代理，提前设置相关环境变量：export http_proxy=http://user:password@host:port。若https连接不上，到GemFile中的source的https修改为http

安装默认的OctoPress 主题：
    
    rake install


----------

## 建立Github的仓库 ##

命名为：你的名字.github.io

## 部署 ##

    rake setup_github_pages
这样做的结果是：

1. 询问你的Github Pages 的仓库URL。
1. 从origin重命名指向imathis/octopress 的remote 到octopress
1. 增加你的Github pages 的仓库为默认的 origin remote
1. 当前branch 从master 转换到source
1. 配置你的博客url
1. 在_deploy文件下下配置一个master 分支用于开发

----------

## 发布： ##
	

    rake generate
    rake deploy


----------
这样就会生成你的博客，复制生成的文件到_deploy/下，并增加到git，commit 和push到master分支。

最后，commit源文件

    git add .
    git commit -m '提交信息'
    git push origin source

现在，访问你的用户名.github.io就可以访问你的博客了。（第一次可能会延迟十几分钟）


----------
## 新增博文 ##
    rake new_post["title"]

这里会生成一个markdown文件到source/_posts下

修改此markdown文件，再次发布，即可看到新的博文。


----------


有关markdown的语法和使用请参看[http://wowubuntu.com/markdown/basic.html](http://wowubuntu.com/markdown/basic.html)

更多octopress命令是查看：[http://octopress.org/docs/blogging/](http://octopress.org/docs/blogging/)


