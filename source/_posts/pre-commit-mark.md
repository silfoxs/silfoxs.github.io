---
title: pre-commit 使用备忘
date: 2021-01-08 15:55:11
summary: pre-commit 使用备忘
tags:
  - pre-commit
categories:
  - 技术文章
---
# php篇

### 配置
|文件名|.pre-commit-config.yaml|
|-|-|
|路径|cd $HOME|

### 内容
``` yaml
repos:
 - repo: https://github.com/pre-commit/pre-commit-hooks
   rev: v3.4.0
   hooks:
   - id: check-yaml
   - id: check-json
 - repo: https://github.com/digitalpulp/pre-commit-php.git
   rev: 1.4.0
   hooks:
   - id: php-lint-all
     files: \.(php)$
 - repo: https://gitlab.com/PyCQA/flake8
   rev: 3.8.4
   hooks:
   - id: flake8
```
### 配置alias
> alias pre="pre-commit run --config ${HOME}/.pre-commit-config.yaml"

### 使用方法
``` bash
#将修改添加到暂存区
git add .
#执行校验该步骤将会执行hook
pre
#校验通过再进行commit
git commit --amend
```

### 更多信息
参考文档：[pre-commit][1]

<!-- 标记 -->
[1]:https://pre-commit.com/
