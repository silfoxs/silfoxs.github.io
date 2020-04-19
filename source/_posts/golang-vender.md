---
title: golang vender的使用
date: 2020-04-18 21:03:30
tags: [golang,vender]
categories:
  - 技术文章
---
## 前言
我们有个项目引入了各种包,每次部署的时候是不是都很烦
新人独白:天哪!这么多包下载到什么时候!要炸了~~~
别怕go自带的vendor帮你解决这个问题
## 老项目引入mod vendor
还是我们的test项目
![目录结构](https://upload-images.jianshu.io/upload_images/22774927-ffe8d57c6ce1384e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
在我们的main.go文件引入gin框架的包
![引入gin包](https://upload-images.jianshu.io/upload_images/22774927-9297aef34622dfa0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
上面我只是做演示所以并没有真正去使用这个包
在项目test目录下执行go mod vendor
![目录结构](https://upload-images.jianshu.io/upload_images/22774927-7ca86977e4d44621.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
现在我们的目录下就多了vendor目录及go.sum文件
## 效果展示
vendor下面是我们依赖的包,结构如下
![vendor目录结构](https://upload-images.jianshu.io/upload_images/22774927-00e353aa80206a99.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
go.sum是导入包的信息
![go sum内容](https://upload-images.jianshu.io/upload_images/22774927-02ef6ee2d50467b8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
这里我只截取了部分演示
## 完结
好了,后面我们就可以把vendor和go.sum都添加进我们的代码仓库里面,再也不用担心每次都下载一大堆包了
