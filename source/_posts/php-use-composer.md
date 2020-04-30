---
title: php项目中使用composer
date: 2020-04-30 11:05:44
summary: composer的使用入门
tags:
  - php
categories:
  - 技术文章
---
## 准备工作
> 需已安装composer,未安装的请自行百度
## 编写composer
> 编写composer.json 引入monolog处理日志
> 这里由于我使用的php7.0x,所以引用的monolog-1.x版本的,版本2.x需要php7.2,按需选择即可
```json
{
    "require": {
        "monolog/monolog": "1.*"
    },
    "repositories": {}
}
```
## 安装
> 保存composer.json文件
> 执行composer install
> 结果如下
```
Loading composer repositories with package information
Updating dependencies (including require-dev)
Package operations: 1 install, 0 updates, 0 removals
  - Installing monolog/monolog (1.25.3): Downloading (100%)
```
## 使用
> 编写index.php
```php
require __DIR__.'/../vendor/autoload.php';


use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\FirePHPHandler;

$logger = new Logger('test_logger');

$logger->pushHandler(
    new StreamHandler(__DIR__.'/../log/test.log', Logger::DEBUG)
);
$logger->pushHandler(new FirePHPHandler());
$logger->info('hello log!');
```
## 结语
> 大家可以看一看自己的日志是不是记下来了呢
> 有其他问题记得联系我
