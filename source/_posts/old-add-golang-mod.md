---
title: 老项目加入golang mod模式
date: 2020-04-18 22:44:45
summary: golang module介绍
tags:
  - golang
categories:
  - 技术文章
---
## 老项目如何迁移至mod
现在我们有一个老项目test,结构如下
![目录结构](https://upload-images.jianshu.io/upload_images/22774927-c978a805c84d703e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
很显然这不是一个mod项目,下面我们将演示如何将它转变为mod
## 初始化mod
在我的项目test目录下执行go mod init test (注意:test改成你自己的项目名称即可)
![初始化mod](https://upload-images.jianshu.io/upload_images/22774927-037a99896a1277e7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
如上图,我们的项目目录下就会生成go.mod文件,内容如下
## 结果
![go mod内容](https://upload-images.jianshu.io/upload_images/22774927-1ced8fa28b5e52e1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
现在我们就将项目加入mod模式了
