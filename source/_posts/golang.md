---
title: github + drone自动化部署
date: 2020-04-18 12:38:22
tags:
---
## 前言
很多同学用github管理我们的代码,下面介绍下怎么用github+drone搭建自己的持续集成服务
## 申请oauth
因为我们需要依赖github的oauth服务,先申请一个Client Id和Client Secret:
申请页面位于github->setting->Developer settings->OAuth Apps
![image.png](https://upload-images.jianshu.io/upload_images/22774927-a73a71a41a689443.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
提交完毕,我们就可以得到Client Id和Client Secret:
![image](https://upload-images.jianshu.io/upload_images/22774927-d3ae094458479a2c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
## 编写docker-compose
接下来创建一个docker-compose.yml文件内容如下:
```yaml
version: '2'
services:
  drone-server:
    image: drone/drone:1
    container_name: drone-server
    ports:
      - '10081:80'      # Web管理面板的入口 PROTO=http  时使用该端口
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock   # docker.sock [1]
      - /var/data/drone/:/var/lib/drone             # drone数据存放路径
    environment:
      - DRONE_GITHUB_CLIENT_ID=${DRONE_GITHUB_CLIENT_ID}  #上面申请的github CLIENT_ID
      - DRONE_GITHUB_CLIENT_SECRET=${DRONE_GITHUB_CLIENT_SECRET}#上面申请的github CLIENT_SECRET
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET}   #你的密钥MD5值即可
      - DRONE_SERVER_HOST=你的IP:10081
      - DRONE_SERVER_PROTO=${DRONE_SERVER_PROTO} #http 或 https  
      - TZ=Asia/Shanghai
    restart: always
  drone-agent:
    image: drone/drone-runner-docker:1
    container_name: drone-runner
    depends_on:
      - drone-server
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # docker.sock [1]
    environment:
      - DRONE_RPC_PROTO=${DRONE_SERVER_PROTO} #http 或 https
      - DRONE_RPC_HOST=你的IP:10081
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET} #你的密钥MD5值即可,跟上面的保持一致
      - DRONE_RUNNER_CAPACITY=2 #最多同时运行几个
      - DRONE_RUNNER_NAME=你的IP
      - TZ=Asia/Shanghai
    restart: always
```
当前目录下执行docker-compose up -d就可以启动了.
![image](https://upload-images.jianshu.io/upload_images/22774927-ff15ddc62e6c03a4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
访问我们的主页你的ip:10081,效果如图
![image](https://upload-images.jianshu.io/upload_images/22774927-fb4254c911fe9823.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![image](https://upload-images.jianshu.io/upload_images/22774927-7548f78948808524.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
## 编写.drone.yml
上图可以看到需要开启自动集成的项目还需要编写.drone.yml文件
```yaml
---
kind: pipeline
type: docker
name: api-ui
workspace:
  base: /data/service
  path: .
steps:
- name: 部署api-ui项目
  image: appleboy/drone-ssh
  settings:
    host:
      from_secret: host
    port: 22
    username:
      from_secret: ssh_name
    password:
      from_secret: ssh_passwd
    script:
      - cd /home/xxxxxx/www/api-ui/
      - pwd && ls -l
      - git pull origin master
      - rm -rf dist/*
      - cnpm run build
      - pwd && ls -l
      - docker build -t api-ui:v1 .
      - docker rm -f api-ui || true
      - docker run -d --rm --name api-ui -p 80:80 api-ui:v1
```
上面的from_secret后面的值可以在我们的setting页面添加
![image](https://upload-images.jianshu.io/upload_images/22774927-9196b5e02ca7cf6c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
设置完毕,我们后续提交代码的时候就会自动同步到我们的服务器了,是不是很方便呢
![image](https://upload-images.jianshu.io/upload_images/22774927-06e27c220914bc27.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
