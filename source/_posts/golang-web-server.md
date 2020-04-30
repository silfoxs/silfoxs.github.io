---
title: golang实现一个简单的webserver
date: 2020-04-21 16:24:05
summary: 介绍怎么用golang开发一个webserver服务
tags:
  - golang
categories:
  - 技术文章
---
## 官网DEMO
>先上一个官网的示例
>简单几行代码即可实现一个webserver
```go
package main

import (
	"io"
	"log"
	"net/http"
)

func main() {
	// Hello world, the web server

	helloHandler := func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "Hello, world!\n")
	}

	http.HandleFunc("/hello", helloHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```
## 进阶版
> 进阶版我们封装了以下功能
> - 用一个gin框架
> - 实现一个route
> - 实现controller
> - 实现一个中间件
> - 加一个单测
> 代码如下
```go
//main.go
package main

import (
	routes "api/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	route := routes.Router(r)
	route.Run(":8080")
}

//单测示例,其实并没用
func hello() string {
	return "hello"
}
```
```go
// routes/route.go
package routes

import (
	c "api/controller"
	m "api/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) *gin.Engine {
    r.Use(m.SetHeader())
    //路由组,很方便
	v1 := r.Group("/v1")
	{
        //访问地址 http://hostname/v1/hello
		v1.GET("/hello", c.Hello)
	}
	return r
}
```
```go
// controller/hello.go
package controller

import (
	"github.com/gin-gonic/gin"
)

type Hello struct {
	Text  string `json:"text"`
}

//golang 的方法首字母大写表示public修饰符
func Hello(c *gin.Context) {
	data := Hello{
        text: "hello word"
    }
    //返回json信息
	c.JSON(200, gin.H{
		"data": data,
	})
}
```
```go
// middleware/header.go
package middleware

import (
	"github.com/gin-gonic/gin"
)

//简单的跨域中间件
func SetHeader() gin.HandlerFunc {
	return func(c *gin.Context) {
		// gin设置响应头，设置跨域
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Header("Access-Control-Allow-Headers", "Action, Module, X-PINGOTHER, Content-Type, Content-Disposition")
		c.Set("content-type", "application/json")
		c.Next()
	}
}

```
```go
// main_test.go 单测示例
package main

import "testing"

func TestHello(t *testing.T) {
	if hello() != "hello" {
		t.Error("Testing error")
	}
}
```

>好了,一个简单的webserver就搞定了
>所有示例都是go module模式下的,不会的同学可以看我其他文章有介绍
