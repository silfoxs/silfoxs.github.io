---
title: golang实现一个冒泡算法
date: 2020-04-20 17:24:44
summary: 闲来无聊手撸一个冒泡玩玩
keywords:
  - golang
  - 冒泡
  - 算法
tags:
  - golang
  - 算法
categories:
  - 技术文章
---
> 序言
> 闲来无聊手撸一个冒泡玩玩
## 代码
``` go
package main

import "fmt"

var arr  = []int{12,14,78,56,98,34,7,4,1,1}

//冒泡
func main()  {
	for i := range arr {
		for j := range arr {
			if arr[i] < arr[j] {
				tmp := arr[j]
				arr[j] = arr[i]
				arr[i] = tmp
			}
		}
	}
	fmt.Println(arr)
}
```
