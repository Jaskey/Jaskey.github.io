---
layout: post
title: "CSS中的display 'block','inline','inline-block'"
date: 2015-02-16 16:39:20 +0800
comments: true
categories: css
---

CSS的 `display` 中有三个不同的值会影响布局，今天把总结下几个的不同特点。

## display: inline ##

1. 不会加入换行符，可以允许后面有HTML元素挨着。
2. margin-top/bottommargin-top/bottom 失效.
3. padding-top/bottom可以生效,但是不影响空白的空间,所以设置的padding会和其他元素重叠
4. **不能**设置`width`或者`height`

inline的元素有:

`<span>``<a>`

## display: block ##

1. 在block后强制换行
2. 可以设置`width`或者`height`
3. padding,margin表现正常

block的元素有:

`<p>``<div>``<h1>`

## display: inline-block ##

1. 像`inline`一样,允许元素挨在同一行,
2. 可以设置`width`或者`height`
3. 像`block`一样,padding,margin表现正常

##例子##

以下几张图展现几个不同的`display效果`:

假如我们在div的一大串文字中,嵌入了一个`<span>`的文字, 通过设置span的不同`display`,将有以下效果:

**diplay:inline**

![display:inline](/images/css/display-inline.png"display:inline")

**display:block**

![display:block](/images/css/display-block.png"display:block")

**display:inline-block**

![display:inline-block](/images/css/display-inline-block.png"display:inline-block")

可以认为,`display:inline-block`就像`display:inline`一样,但是可以正常的设置高度和宽度等属性.所以我们可以使用`display:inline-block`替换`float`,去完成文字环绕.


[demo链接](http://jsfiddle.net/Mta2b/ "demo链接")