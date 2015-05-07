---
layout: post
title: "修改IntelliJ的快捷键中的CTRL+Y为Redo操作"
date: 2015-05-07 18:02:57 +0800
comments: true
categories: 
---

IntelliJ是一个非常强大的IDE，但是对于长期习惯Windows用户，里面有些快捷键非常不好。最典型的就是<kbd>CTRL</kbd>+<kbd>Y</kbd>，在IntelliJ里面<kbd>CTRL</kbd>+<kbd>Y</kbd>是删除操作，可是我们习惯与<KBD>CTRL</KBD>+<KBD>Y</KBD>是Redo（重做）操作。

可以用以下方式修改这些快捷键,注：适用如IDEA, PyCharm等IDE:


1. 进入Settings（快捷键：<kbd>CTRL</kbd>+<kbd>ALT</kbd>+<kbd>S</kbd>，或者<kbd>SHITT</kbd>*2出`Search Everywhere`中搜索settings进入）
2. 左边菜单选择KeyMap（可搜索）
3. 选择默认的keymaps（IntelliJ的）,然后选择copy出一份新的，在新的keymaps里面修改
4. 在新的keymaps里面的`Main Menu-->Edit-->Redo` 右键选择 `Add Keyboard Shortcut`
5. 键盘按<kbd>CTRL</kbd>+<kbd>Y</kbd> (修改的快捷键)
6. OK
7. 选择 "Remove" ，当窗口提示： "the shortcut is already assigned to other actions. Do you want to remove other assignments?"
8. Apply

