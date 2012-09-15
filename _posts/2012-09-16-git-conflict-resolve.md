---
layout: post
title: "git conflict resolve"
description: ""
category: git
tags: [git, resolve, conflict]
---
{% include JB/setup %}

### 非快速式推送 (non-fast-forward push)


* * *

### 解决过程


合并后推送

* * * 

### 发生冲突时,快速查看冲突

{% highlight bash %}
    git diff --theirs    # pull后, 与remote版本的差别
    git diff --base      # pull后, 与共同祖先版本的差别
    git diff --ours      # pull后, 与我自己的版本的差别
{% endhighlight %}
