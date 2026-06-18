---
title: "修复 macOS CursorUIViewService 未响应与输入卡顿"
description: "一次 CursorUIViewService 占用大量内存、频繁未响应的排查记录：它不是 Cursor 编辑器进程，而是 macOS TextInputUI 的光标旁输入提示服务。本文整理触发原因、验证路径、通用修复命令与回滚方式。"
date: 2026-06-18
publishedAt: 2026-06-18T16:45:00+08:00
badge: macOS
cover: "/images/posts/macos-cursoruiviewservice-not-responding.png"
tags:
  - "macOS"
  - "Troubleshooting"
  - "Input Method"
  - "Performance"
  - "Tech"
draft: false
archive: true
---

![活动监视器中 CursorUIViewService 显示未响应](./macos-cursoruiviewservice-redesigned-text-cursor/macos-cursoruiviewservice-not-responding.png)

## 背景

最近遇到一个很烦的 macOS 问题：活动监视器里 `CursorUIViewService` 经常显示“未响应”，内存占用会涨到数 GB，伴随输入延迟、切换大小写变慢、应用窗口短暂卡顿。

第一眼看到这个名字，很容易误以为它和 Cursor 编辑器有关。实际不是。它是 Apple 自带的系统服务，bundle id 是：

```text
com.apple.TextInputUI.xpc.CursorUIViewService
```

在系统里对应的路径大致是：

```text
/System/Library/PrivateFrameworks/TextInputUIMacHelper.framework/Versions/A/XPCServices/CursorUIViewService.xpc
```

从系统组件名和二进制里的类名看，它属于 TextInputUI，用来处理文本光标旁边的输入法状态、Caps Lock 状态、输入源切换等小浮窗。

## 现象

比较典型的表现包括：

- 活动监视器里 `CursorUIViewService` 显示未响应。
- 内存占用持续上涨，从几百 MB 到几 GB 不等。
- 输入文字时有延迟，尤其是切换中英文或 Caps Lock 后。
- 长时间开机、睡眠唤醒、频繁切换输入源后更容易复现。
- 使用截图、窗口枚举、屏幕共享一类功能时变慢，因为系统里可能堆积了大量不可见窗口。

网上的讨论大多把问题指向 macOS Sonoma 之后引入的新版文本光标和 Caps Lock 指示器。Apple 没有给出一个明确的公开修复说明，但社区里已经有较稳定的绕过方案。

## 原因判断

`CursorUIViewService` 负责的不是普通鼠标指针，而是“文字插入点附近的 UI”。macOS 在输入框里切换输入法或按下 Caps Lock 时，会在光标旁显示一个小提示。这个 UI 在一些系统版本中会卡住、泄漏窗口或内存，最后表现为服务未响应。

常见触发条件有几类：

- 频繁切换输入法。
- 用 Caps Lock 切换中英文或大小写。
- 长时间不重启，反复睡眠唤醒。
- 某些按应用自动切换输入法的工具与系统提示 UI 叠加触发。

如果没有安装第三方输入法管理工具，仍然遇到这个问题，最直接的处理方式是禁用新版文本光标提示。

## 通用修复

执行下面命令，禁用 `redesigned_text_cursor` 这个系统 feature flag：

```bash
sudo mkdir -p /Library/Preferences/FeatureFlags/Domain
sudo defaults write /Library/Preferences/FeatureFlags/Domain/UIKit.plist redesigned_text_cursor -dict-add Enabled -bool NO
```

检查写入结果：

```bash
defaults read /Library/Preferences/FeatureFlags/Domain/UIKit.plist redesigned_text_cursor
```

正常结果类似：

```text
{
    Enabled = 0;
}
```

然后重启 Mac。仅写入配置不一定立即生效，重启是必要步骤。

这个改动的副作用是：光标旁的输入法/Caps Lock 状态提示会消失。菜单栏里的输入法状态仍然可用。对我来说，这个代价比输入卡顿和数 GB 内存占用要小得多。

## 回滚方式

如果系统更新修复了问题，或者想恢复默认行为，可以删除这个 feature flag：

```bash
sudo defaults delete /Library/Preferences/FeatureFlags/Domain/UIKit.plist redesigned_text_cursor
```

同样建议重启后再观察。

## 不建议的处理

活动监视器里强制退出 `CursorUIViewService` 只能短期止血。它会被系统重新拉起，而且在某些情况下强杀系统 UI 服务可能导致界面短暂卡住。

如果只是偶发，可以重启；如果频繁复现，禁用新版文本光标提示更稳定。

## 参考线索

- V2EX 相关讨论里，多位用户反馈禁用 `redesigned_text_cursor` 后 `CursorUIViewService` 不再反复出现或未响应。
- Stack Overflow 上也有同类问题和相同命令，主题是禁用 macOS Sonoma 的文本插入点/Caps Lock 指示器。
- Apple Developer Forums 有用户描述 `CursorUIViewService` 未响应会导致输入与大小写切换卡顿，并关联蓝色 Caps Lock 指示器。
- Reddit 上有人排查到该服务会累积大量离屏窗口，影响窗口枚举和截图相关 API。

## 总结

`CursorUIViewService` 不是第三方编辑器进程，而是 macOS TextInputUI 的一部分。它的问题通常和新版文本光标、输入源提示、Caps Lock 指示器有关。

如果它频繁未响应、占用大量内存，并且没有明显第三方输入法工具冲突，可以优先尝试禁用 `redesigned_text_cursor`。这个方案不是 Apple 官方 UI 设置，但目前是社区验证较多、回滚也简单的绕过方案。
