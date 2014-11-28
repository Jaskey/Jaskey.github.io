---
layout: post
title: "5分钟速写自定义搜索引擎插件"
date: 2014-11-06 15:18:03 +0800
comments: true
categories: firefox
---

最近搞了几个火狐自定义的搜索引擎插件，就像这里这些插件：

![搜索引擎插件](/images/firefox-serach-engine-plugin/search-plugin.jpg "搜索引擎插件")

对于某些经常使用搜索的内外网站，如豆瓣或者公司内部的Bug号搜索，代码搜索等，都可以提供一定程度的便利。

今天把写的过程分享一下，5分钟便可自己写上一个了。


## 语法部分 ##

详细的官网文档是：https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/Creating_OpenSearch_plugins_for_Firefox

我们直接上一个例子，这样上手最快。

先简单浏览下写搜索引擎插件的语法：

	<?xml version="1.0" encoding="UTF-8"?>
	<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"
	                       xmlns:moz="http://www.mozilla.org/2006/browser/search/">
	  <ShortName>engineName</ShortName>
	  <Description>engineDescription</Description>
	  <InputEncoding>inputEncoding</InputEncoding>
	  <Image width="16" height="16" type="image/x-icon">data:image/x-icon;base64,imageData</Image>
	  <Url type="text/html" method="method" template="searchURL">
	    <Param name="paramName1" value="paramValue1"/>
	    ...
	    <Param name="paramNameN" value="paramValueN"/>
	  </Url>
	  <Url type="application/x-suggestions+json" template="suggestionURL"/>
	  <moz:SearchForm>searchFormURL</moz:SearchForm>
	</OpenSearchDescription>


这样一个xml文件，即便什么都不看，都能大致模仿而写出一个。

解释一下其中某些标签的作用：

**ShortName**: 搜索引擎的简称，最后会显示到界面中

**Image**：使用指向一个图标的URL来代表这个搜索引擎，可以使用链接，也可以使用http://software.hixie.ch/utilities/cgi/data/data 生成base64编码的data: URI。

**URL**:这是我们关心的重点。其中两个上面两个URL例子，其中一个`type=text/html`,另一个`type=application/x-suggestions+json`。

`type="text/html"` 用来指定进行搜索查询的URL.

`type="application/x-suggestions+json"` 用来指定获取搜索建议（search suggestions）的URL. 如下图所示：

![搜索建议](/images/firefox-serach-engine-plugin/suggestions.jpg "搜索建议")


## 例子——豆瓣 ##
**大致介绍到这里，直接上一个我写的豆瓣的例子**

首先，在 火狐安装路径"%PROGRAM_FILES%\Mozilla Firefox\searchplugins"下新建一个xml文件，如douban.xml

然后复制上面的模板，进行修改，以下是我的douban.xml(注：由于base64图片编码太长，以下省略为......)

    <?xml version="1.0" encoding="UTF-8"?>
    <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"
       xmlns:moz="http://www.mozilla.org/2006/browser/search/">
      <ShortName>豆瓣搜索</ShortName>
      <Description>使用豆瓣进行搜索</Description>
      <InputEncoding>UTF-8</InputEncoding>
      <Image width="16" height="16" type="image/x-icon">..........</Image>
      <Url type="text/html" method="GET" template="http://www.douban.com/search">
         <Param name="source" value="suggest"/>
         <Param name="q" value="{searchTerms}"/>
      </Url>
      <Url type="application/x-suggestions+json" method="GET" template="https://www.google.com/complete/search?client=firefox&amp;q={searchTerms}"/>
      <moz:SearchForm>http://www.douban.com/search</moz:SearchForm>
    </OpenSearchDescription>

其中值得留意的地方就是`value ="{searchTerms}"`这里,{serachTerms}表示的是用户在搜框输入的字符串。


而最后的SearchForm表示跳往搜索页的 URL. 这使得Firefox能让用户直接浏览目的网站.这是火狐限定的语法部分，不是标准的opensource部分。

**关于搜索建议**

这里我使用的搜索建议是谷歌的，原封不动的使用这段即可。

      <Url type="application/x-suggestions+json" method="GET" template="https://www.google.com/complete/search?client=firefox&amp;q={searchTerms}"/>

假如我使用“初恋”作为关键字，将返回类似的以下JSON格式：
    
    ["初恋",["初恋这件小事","初恋50次","初恋那件小事","初恋","初恋未满","初恋限定","初恋大作战","初恋的回忆","初恋情人","初恋逆袭系统"]]

所以如果需要使用自己的搜索建议，需要保持相应的JSON格式，并且需要保证在500毫秒内返回，关于这点，有空再另外写一篇博文。

最后保存，重启火狐浏览器，就应该能够看到自己增加的小插件啦。

--------------

注1：如果浏览器还是没有找到这个插件的话，打开%AppData%\Mozilla\Firefox\Profiles\XXXXX.default下，prefs.js，里面加入/修改以下的配置：


	user_pref("browser.search.selectedEngine", "engine_name");


以上解决方案来源于：[adding a custom search engine tofirefox](http://stackoverflow.com/questions/9963256/adding-a-custom-search-engine-to-firefox)

注2：  在我本机中，每次修改xml文件后，即使重启火狐都无法获得最新的配置，需要重命名为另外一文件。如果遇到一直修改都无法生效的时候，可以尝试一下这个方法。

## 发布分享 ##

写完之后并本机测试后，如果希望可以分享给其他人都使用，可以注册一个开发者账号，然后到https://addons.mozilla.org/zh-CN/developers/addon/submit/1 提交这个xml文件就可以供大家使用了。


大家可以在https://addons.mozilla.org/zh-CN/firefox/addon/doubanserach 找到我豆瓣的这个例子