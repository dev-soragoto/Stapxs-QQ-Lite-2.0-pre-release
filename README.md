# Stapxs-QQ-Lite-2.0-pre-release

## web端使用

[https://dev-soragoto.github.io/Stapxs-QQ-Lite-2.0-pre-release/](https://dev-soragoto.github.io/Stapxs-QQ-Lite-2.0-pre-release/)

## wip

~~施工中，什么时候完成我也不知道，先挖个坑在这里~~

已经施工的差不多了，应该能用。

## 当前进度

1. ~~自动同步上游最新分支。~~
2. ~~更改上游最新分支的版本号，如果是 pre-release 添加最后一次更新的时间戳。~~
3. ~~如果是 pre-release ，把更新检测指向本仓库。~~
4. ~~打包，在本仓库发布 release 。~~
5. 想办法在electron打包上加上Arch-linux原生包，`git format-patch`感觉不太好用，`sed`写起来又太费劲，我得想想还有没有其他办法


## 这是做什么的

为 [Stapxs-QQ-Lite](https://github.com/Stapxs/Stapxs-QQ-Lite-2.0) 提供一个非官方的 pre-release

会自动同步上游最新更改，更新版本号后缀为更改日期后自动打包


## 警告

既然是 pre-release 那发生什么异常都是有可能的，谨慎使用
