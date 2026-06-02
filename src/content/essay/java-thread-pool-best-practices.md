---
title: "Java线程池配置最佳实践指南"
description: "深入解析Java线程池配置策略，涵盖IO密集型与CPU密集型任务的参数计算、常见场景配置模板、监控调优方法，以及JDK 21虚拟线程的使用指南"
date: 2025-10-14
publishedAt: 2025-10-14T10:00:00+08:00
badge: Java
tags:
  - "Java"
  - "Threading"
  - "Thread Pool"
  - "Performance"
  - "Concurrency"
  - "JDK21"
  - "Virtual Threads"
  - "Tech"
draft: false
archive: true
---
## 目录

- [线程池核心概念](#线程池核心概念)
  - [为什么需要线程池？](#为什么需要线程池)
  - [核心参数详解](#核心参数详解)
  - [线程池工作流程](#线程池工作流程)
- [任务类型分析与参数计算](#任务类型分析与参数计算)
  - [任务类型分类](#任务类型分类)
  - [队列选择策略](#队列选择策略)
  - [拒绝策略选择](#拒绝策略选择)
- [常见场景配置模板](#常见场景配置模板)
  - [Web应用请求处理](#web应用请求处理)
  - [消息队列消费](#消息队列消费)
  - [定时任务执行](#定时任务执行)
  - [批处理任务](#批处理任务)
- [监控与调优](#监控与调优)
  - [关键监控指标](#关键监控指标)
  - [性能调优步骤](#性能调优步骤)
  - [常见问题与解决方案](#常见问题与解决方案)
- [JDK 21 虚拟线程](#jdk-21-虚拟线程)
  - [虚拟线程概述](#虚拟线程概述)
  - [虚拟线程 vs 传统线程池](#虚拟线程-vs-传统线程池)
  - [虚拟线程使用示例](#虚拟线程使用示例)
  - [虚拟线程最佳实践](#虚拟线程最佳实践)
  - [迁移指南](#迁移指南)
- [最佳实践清单](#最佳实践清单)
  - [设计原则](#设计原则)
  - [反模式警告](#反模式警告)
  - [工具推荐](#工具推荐)
  - [动态调整示例](#动态调整示例)
- [总结](#总结)

## 线程池核心概念

### 为什么需要线程池？

线程池解决了以下问题：
- **资源开销**：避免频繁创建和销毁线程的开销
- **响应速度**：任务到达时，无需等待线程创建
- **资源管理**：通过线程数量限制，防止过度消耗系统资源
- **统一管理**：提供统一的线程管理和监控机制

### 核心参数详解

```java
ThreadPoolExecutor(
    int corePoolSize,      // 核心线程数
    int maximumPoolSize,   // 最大线程数
    long keepAliveTime,    // 非核心线程空闲存活时间
    TimeUnit unit,         // 时间单位
    BlockingQueue<Runnable> workQueue,  // 任务队列
    ThreadFactory threadFactory,        // 线程工厂
    RejectedExecutionHandler handler    // 拒绝策略
)
```

#### 参数含义与影响

| 参数 | 含义 | 影响 |
|------|------|------|
| corePoolSize | 核心线程数，即使空闲也会保持存活 | 决定并发处理能力的基准 |
| maximumPoolSize | 最大线程数，包含核心和非核心线程 | 决定峰值处理能力 |
| keepAliveTime | 非核心线程的空闲存活时间 | 影响资源回收速度 |
| workQueue | 存放待执行任务的队列 | 决定缓冲能力和内存占用 |
| handler | 队列满且线程数达到最大时的处理策略 | 决定过载时的行为 |

### 线程池工作流程

```
任务提交 → 核心线程是否已满？
    ↓ 否：创建新核心线程执行
    ↓ 是
队列是否已满？
    ↓ 否：加入队列等待
    ↓ 是
是否达到最大线程数？
    ↓ 否：创建非核心线程执行
    ↓ 是
执行拒绝策略
```

## 任务类型分析与参数计算

### 任务类型分类

#### IO密集型任务
**特征**：
- 大部分时间在等待IO操作（网络请求、数据库查询、文件读写）
- CPU利用率低，线程经常处于阻塞状态
- 可以支持更多的并发线程

**线程数计算公式**：
```
线程数 = CPU核数 × (1 + 平均等待时间/平均计算时间)

经验值：线程数 = CPU核数 × 2 到 CPU核数 × 5
```

**示例配置**：
```java
// 假设4核CPU，IO密集型任务
int cpuCores = Runtime.getRuntime().availableProcessors();
int corePoolSize = cpuCores * 3;        // 12
int maxPoolSize = cpuCores * 5;         // 20
int queueCapacity = 1000;                // 根据内存和业务容忍度设置

ThreadPoolExecutor executor = new ThreadPoolExecutor(
    corePoolSize,
    maxPoolSize,
    60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(queueCapacity),
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

#### CPU密集型任务
**特征**：
- 大部分时间在进行CPU计算
- 线程很少阻塞，持续占用CPU
- 过多线程会导致频繁上下文切换

**线程数计算公式**：
```
线程数 = CPU核数 + 1

说明：+1是为了当某个线程因偶发的页错误或其他原因暂停时，
      额外的线程能确保CPU利用率
```

**示例配置**：
```java
// 假设4核CPU，CPU密集型任务
int cpuCores = Runtime.getRuntime().availableProcessors();
int poolSize = cpuCores + 1;            // 5
int queueCapacity = 100;                 // CPU密集型任务队列不宜过大

ThreadPoolExecutor executor = new ThreadPoolExecutor(
    poolSize,
    poolSize,  // 核心线程数等于最大线程数
    0L, TimeUnit.MILLISECONDS,  // CPU密集型无需超时
    new ArrayBlockingQueue<>(queueCapacity),
    new ThreadPoolExecutor.AbortPolicy()  // 快速失败
);
```

#### 混合型任务
**特征**：
- 既有计算又有IO操作
- 需要根据实际比例调整

**线程数计算**：
```
根据IO操作占比调整：
- IO占比70%：按IO密集型的70%配置
- IO占比30%：按CPU密集型配置，略微增加
```

### 队列选择策略

| 队列类型 | 特点 | 适用场景 |
|---------|------|----------|
| ArrayBlockingQueue | 有界队列，FIFO | 需要限制内存占用 |
| LinkedBlockingQueue | 可选有界，FIFO | 吞吐量要求高 |
| SynchronousQueue | 不存储元素，直接传递 | 要求立即处理或拒绝 |
| PriorityBlockingQueue | 优先级队列 | 任务有优先级要求 |
| DelayQueue | 延迟队列 | 定时任务场景 |

注意：ThreadPoolExecutor 的扩容顺序为"先入队 → 队列满时才扩容到 maximumPoolSize"。队列过大将抑制扩容、放大排队等待，易推高尾部延迟（P99）。延迟敏感场景优先采用较小队列以便更早触发扩容。

### 拒绝策略选择

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| AbortPolicy | 抛出异常 | 关键任务，需要立即感知失败 |
| CallerRunsPolicy | 调用者线程执行 | 实现自然背压，不允许丢失任务 |
| DiscardPolicy | 直接丢弃 | 允许丢失的非关键任务 |
| DiscardOldestPolicy | 丢弃最老的任务 | 时效性要求高，老数据价值低 |

注意：CallerRunsPolicy 会在提交任务的线程中执行任务。若提交方是事件循环/网络回调线程（如 Netty、MQTT、Servlet I/O 线程），可能造成回调阻塞与抖动，请谨慎使用。

## 常见场景配置模板

### Web应用请求处理

```java
@Configuration
public class WebThreadPoolConfig {

    @Bean
    public ThreadPoolExecutor webRequestExecutor() {
        int cpuCores = Runtime.getRuntime().availableProcessors();

        return new ThreadPoolExecutor(
            cpuCores * 2,      // 核心线程数
            cpuCores * 4,      // 最大线程数
            60L,                // 空闲时间
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(200),  // 有界队列（时延优先，促使更早扩容，降低P99）
            r -> {
                Thread t = new Thread(r);
                t.setName("web-request-" + t.getId());
                t.setDaemon(false);
                return t;
            },
            new ThreadPoolExecutor.CallerRunsPolicy()  // 背压策略（仅当提交方可阻塞时使用）
        );
    }
}
```

### 消息队列消费

```java
@Configuration
public class MessageConsumerConfig {

    @Bean
    public ThreadPoolExecutor messageConsumerExecutor() {
        // 消息消费通常是IO密集型
        return new ThreadPoolExecutor(
            10,                 // 核心线程数
            20,                 // 最大线程数
            120L,               // 较长的存活时间
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000), // 适度缓冲（吞吐与时延折中）
            new ThreadFactory() {
                private final AtomicInteger counter = new AtomicInteger(0);
                @Override
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r);
                    t.setName("msg-consumer-" + counter.incrementAndGet());
                    return t;
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy() // 自然背压（注意事件回调线程阻塞风险）
        );
    }
}
```

### 定时任务执行

```java
@Configuration
public class ScheduledTaskConfig {

    @Bean
    public ScheduledThreadPoolExecutor scheduledExecutor() {
        int corePoolSize = 5;  // 根据定时任务数量设置

        ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(
            corePoolSize,
            r -> {
                Thread t = new Thread(r);
                t.setName("scheduled-task-" + t.getId());
                t.setDaemon(true);  // 守护线程
                return t;
            },
            new ThreadPoolExecutor.AbortPolicy()  // 定时任务失败应该报错
        );

        // 定时任务特殊配置
        executor.setRemoveOnCancelPolicy(true);  // 取消时移除
        executor.setContinueExistingPeriodicTasksAfterShutdownPolicy(false);

        return executor;
    }
}
```

### 批处理任务

```java
@Configuration
public class BatchProcessingConfig {

    @Bean
    public ThreadPoolExecutor batchExecutor() {
        // 批处理通常是CPU密集型
        int cpuCores = Runtime.getRuntime().availableProcessors();

        return new ThreadPoolExecutor(
            cpuCores,           // 核心线程数 = CPU核数
            cpuCores * 2,       // 峰值允许2倍
            30L,                // 较短的存活时间
            TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(50),  // 较小队列（CPU密集，避免长排队）
            new ThreadPoolExecutor.CallerRunsPolicy() // 若提交方不可阻塞可改为 AbortPolicy
        );
    }
}
```

## 监控与调优

### 关键监控指标

```java
public class ThreadPoolMonitor {

    public void printStats(ThreadPoolExecutor executor) {
        System.out.println("=== 线程池状态 ===");
        System.out.println("核心线程数: " + executor.getCorePoolSize());
        System.out.println("当前线程数: " + executor.getPoolSize());
        System.out.println("活跃线程数: " + executor.getActiveCount());
        System.out.println("最大线程数: " + executor.getMaximumPoolSize());
        System.out.println("历史最大线程数: " + executor.getLargestPoolSize());
        System.out.println("任务完成数: " + executor.getCompletedTaskCount());
        System.out.println("任务总数: " + executor.getTaskCount());
        System.out.println("队列大小: " + executor.getQueue().size());
        System.out.println("队列剩余容量: " + executor.getQueue().remainingCapacity());
    }

    public Map<String, Object> getMetrics(ThreadPoolExecutor executor) {
        Map<String, Object> metrics = new HashMap<>();

        // 利用率指标（避免除0）
        int poolSize = executor.getPoolSize();
        metrics.put("threadUtilization",
            poolSize > 0 ? (double) executor.getActiveCount() / poolSize : 0);

        // 队列使用率
        BlockingQueue<Runnable> queue = executor.getQueue();
        int queueCapacity = queue.size() + queue.remainingCapacity();
        metrics.put("queueUtilization",
            queueCapacity > 0 ? (double) queue.size() / queueCapacity : 0);

        // 任务等待时间（需要自定义包装）
        // 任务拒绝率（需要自定义计数器）

        return metrics;
    }
}
```

### 性能调优步骤

#### Step 1: 建立基线
```java
// 1. 初始配置（保守配置）
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    5, 10, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100)
);

// 2. 收集指标
- 平均响应时间
- P50/P95/P99延迟
- 吞吐量（TPS）
- 错误率
- CPU/内存使用率
```

#### Step 2: 压力测试
```java
// 使用JMeter、Gatling等工具
- 逐步增加负载
- 记录各指标变化
- 找出瓶颈点
```

#### Step 3: 调整参数
```java
// 调优原则
1. 如果队列经常满：增加队列容量或核心线程数
2. 如果线程经常全部活跃：增加最大线程数
3. 如果响应时间过长：减少队列容量，增加线程数
4. 如果CPU使用率过高：减少线程数
5. 如果内存占用过高：减少队列容量
```

#### Step 4: 验证效果
```java
// 对比调整前后的指标
- 响应时间是否改善
- 吞吐量是否提升
- 资源使用是否合理
- 是否有新的瓶颈
```

### 常见问题与解决方案

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| OOM异常 | 队列无界或过大 | 使用有界队列，限制队列大小 |
| 任务拒绝 | 线程池饱和 | 增加线程数或队列容量，优化任务执行时间 |
| 响应缓慢 | 队列积压严重 | 增加核心线程数，减少队列大小 |
| CPU过高 | 线程过多，上下文切换频繁 | 减少线程数，优化任务逻辑 |
| 线程泄露 | 任务异常未正确处理 | 使用try-finally确保资源释放 |

## JDK 21 虚拟线程

### 虚拟线程概述

JDK 21引入的虚拟线程（Virtual Threads）是一种轻量级线程实现：
- **创建成本极低**：可以创建数百万个虚拟线程
- **自动调度**：由JVM自动映射到平台线程
- **阻塞友好**：阻塞操作不会占用平台线程

### 虚拟线程 vs 传统线程池

| 特性 | 传统线程池 | 虚拟线程 |
|------|-----------|----------|
| 创建成本 | 高（~1MB栈内存） | 极低（~1KB） |
| 数量限制 | 通常几十到几百 | 可达数百万 |
| 配置复杂度 | 需要精心调优 | 几乎零配置 |
| 适用场景 | CPU密集型、需要精确控制 | IO密集型、高并发 |
| 调试复杂度 | 相对简单 | 需要新的调试方法 |

### 虚拟线程使用示例

#### 传统方式 vs 虚拟线程

```java
// 传统线程池方式
public class TraditionalExample {
    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(
        10, 20, 60L, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(100)
    );

    public void handleRequest(Request request) {
        executor.execute(() -> {
            // 处理请求（包含IO操作）
            Response response = callExternalService(request);
            saveToDatabase(response);
        });
    }
}

// 虚拟线程方式（JDK 21+）
public class VirtualThreadExample {
    // 无需配置线程池！

    public void handleRequest(Request request) {
        Thread.startVirtualThread(() -> {
            // 相同的处理逻辑
            Response response = callExternalService(request);
            saveToDatabase(response);
        });
    }

    // 或使用Executor接口
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public void handleRequestWithExecutor(Request request) {
        executor.execute(() -> {
            Response response = callExternalService(request);
            saveToDatabase(response);
        });
    }
}
```

### 虚拟线程最佳实践

#### 适合使用虚拟线程的场景
```java
// 1. 高并发IO密集型任务
public class HighConcurrencyIO {
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public void processManyRequests(List<Request> requests) {
        requests.forEach(request ->
            executor.submit(() -> {
                // 每个请求都可能阻塞在IO上
                callSlowService(request);
            })
        );
    }
}

// 2. 阻塞操作较多的场景
public class BlockingOperations {
    public void waitAndProcess() throws InterruptedException {
        Thread.startVirtualThread(() -> {
            Thread.sleep(1000);  // 虚拟线程中阻塞不会占用平台线程
            processData();
        });
    }
}
```

#### 不适合虚拟线程的场景
```java
// 1. CPU密集型任务 - 仍应使用传统线程池
public class CPUIntensiveTask {
    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(
        Runtime.getRuntime().availableProcessors(),
        Runtime.getRuntime().availableProcessors(),
        0L, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<>(100) // 有界队列，避免无限积压
    );

    public void calculate(ComplexData data) {
        executor.execute(() -> {
            // 纯计算任务，无IO
            performComplexCalculation(data);
        });
    }
}

// 2. 需要线程本地变量的场景
// 虚拟线程的ThreadLocal可能有性能问题
```

#### CompletableFuture 使用注意（虚拟线程）
```java
// 错误示例：未显式传入执行器（默认使用 ForkJoinPool.commonPool 的平台线程）
CompletableFuture.runAsync(this::handleRequest);           // 非虚拟线程
CompletableFuture.supplyAsync(this::compute);              // 非虚拟线程

// 正确示例1：显式传入虚拟线程执行器（推荐在 try-with-resources 中管理生命周期）
try (var vte = Executors.newVirtualThreadPerTaskExecutor()) {
    CompletableFuture
        .supplyAsync(this::callBlockingIO, vte)
        // 链式操作：若使用 Async 变体，亦需显式传入同一执行器；
        // 否则会回落到 commonPool（平台线程）
        .thenApplyAsync(this::transform, vte)
        .thenAcceptAsync(this::publish, vte);
}

// 正确示例2：简单场景直接创建虚拟线程更清晰
Thread.startVirtualThread(this::handleRequest);

// 小提示：
// - 需要继续在同一虚拟线程内顺序执行时，优先使用非 Async 变体（thenApply/thenCompose），避免不必要的切换。
// - 服务端场景尽量避免依赖 commonPool，统一使用自管执行器（平台或虚拟）。
```

### 迁移指南

#### 从线程池迁移到虚拟线程

```java
// Before (JDK 8-20)
@Component
public class LegacyService {
    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(
        50, 100, 60L, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(1000)
    );

    public CompletableFuture<Result> processAsync(Input input) {
        return CompletableFuture.supplyAsync(() -> {
            return processInput(input);
        }, executor);
    }
}

// After (JDK 21+)
@Component
public class ModernService {
    // 方式1：直接使用虚拟线程
    public CompletableFuture<Result> processAsync(Input input) {
        return CompletableFuture.supplyAsync(() -> {
            return processInput(input);
        }, Executors.newVirtualThreadPerTaskExecutor());
    }

    // 方式2：使用结构化并发（预览功能）
    public Result processWithStructuredConcurrency(Input input)
            throws InterruptedException, ExecutionException {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            Future<Result> future = scope.fork(() -> processInput(input));
            scope.join();
            scope.throwIfFailed();
            return future.resultNow();
        }
    }
}
```

## 最佳实践清单

### 设计原则

✅ **DO - 推荐做法**
1. **明确任务类型**：先分析是IO密集还是CPU密集
2. **从小开始**：初始配置保守，通过监控逐步调优
3. **使用有界队列**：避免OOM，实现背压
4. **命名线程**：便于调试和监控
5. **优雅关闭**：设置合理的关闭等待时间
6. **监控先行**：建立监控体系再调优
7. **记录拒绝**：统计和记录被拒绝的任务
8. **容器核数**：在容器中确认 `availableProcessors()` 与 cgroup 限制一致；必要时显式设置 `-XX:ActiveProcessorCount`
9. **显式执行器**：服务端使用 `CompletableFuture` 时显式传入自管 `Executor`，避免默认 `commonPool`（虚拟线程请使用 `Executors.newVirtualThreadPerTaskExecutor()`，并在 Async 链上同样传入该执行器）

```java
// 示例：完善的线程池配置
public ThreadPoolExecutor createOptimalExecutor(String name, TaskType type) {
    ThreadPoolExecutor executor = new ThreadPoolExecutor(
        calculateCoreSize(type),
        calculateMaxSize(type),
        60L,
        TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(calculateQueueSize(type)),
        r -> {
            Thread t = new Thread(r);
            t.setName(name + "-" + t.getId());
            t.setUncaughtExceptionHandler((thread, ex) ->
                log.error("Thread {} error", thread.getName(), ex));
            return t;
        },
        new RejectedExecutionHandler() {
            private final AtomicLong rejectedCount = new AtomicLong(0);

            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
                long count = rejectedCount.incrementAndGet();
                log.warn("Task rejected, total rejected: {}", count);
                // 可以选择：抛异常、调用者执行、或其他策略
                throw new RejectedExecutionException("Task rejected");
            }
        }
    );

    // 优雅关闭配置
    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }));

    return executor;
}
```

❌ **DON'T - 避免做法**
1. **避免无界队列**：容易导致OOM
2. **避免过多线程池**：增加管理复杂度和资源碎片化
3. **避免固定配置**：应支持动态调整
4. **避免忽略异常**：任务异常应该被记录
5. **避免共享线程池处理不同类型任务**：隔离关键路径

### 反模式警告

#### 反模式1：一个线程池打天下
```java
// ❌ 错误：所有任务共享一个线程池
@Component
public class BadExample {
    private final ExecutorService executor = Executors.newFixedThreadPool(10);

    public void handleWebRequest() { executor.execute(...); }
    public void processMessage() { executor.execute(...); }
    public void runScheduledTask() { executor.execute(...); }
    // 不同类型的任务相互影响
}

// ✅ 正确：按任务类型隔离
@Component
public class GoodExample {
    private final ThreadPoolExecutor webExecutor = createWebExecutor();
    private final ThreadPoolExecutor messageExecutor = createMessageExecutor();
    private final ScheduledExecutorService scheduledExecutor = createScheduledExecutor();
    // 不同任务独立管理
}
```

#### 反模式2：忽视监控
```java
// ❌ 错误：创建后不管
ThreadPoolExecutor executor = new ThreadPoolExecutor(...);
// 没有任何监控

// ✅ 正确：完善的监控
ThreadPoolExecutor executor = new MonitoredThreadPoolExecutor(...) {
    @Override
    protected void beforeExecute(Thread t, Runnable r) {
        // 记录开始时间
    }

    @Override
    protected void afterExecute(Runnable r, Throwable t) {
        // 记录执行时间、异常等
    }
};
```

### 工具推荐

#### 监控工具
- **Micrometer**: Spring Boot集成的度量库
- **Prometheus + Grafana**: 监控和可视化
- **Java Flight Recorder**: JVM级别的性能分析
- **Async Profiler**: 性能剖析工具

#### 测试工具
- **JMeter**: 负载测试
- **Gatling**: 高性能压测工具
- **JCStress**: 并发正确性测试

#### 分析工具
- **JProfiler**: 线程分析
- **VisualVM**: JVM监控和分析
- **Eclipse MAT**: 内存分析

### 动态调整示例

```java
@Component
public class DynamicThreadPool {
    private final ThreadPoolExecutor executor;

    public DynamicThreadPool() {
        this.executor = new ThreadPoolExecutor(
            10, 50, 60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000)
        );
    }

    // 通过JMX或配置中心动态调整
    public void adjustPoolSize(int core, int max) {
        executor.setCorePoolSize(core);
        executor.setMaximumPoolSize(max);
        log.info("Adjusted pool size: core={}, max={}", core, max);
    }

    // 根据负载自动调整
    @Scheduled(fixedDelay = 60000)
    public void autoAdjust() {
        double utilization = (double) executor.getActiveCount() / executor.getPoolSize();

        if (utilization > 0.8 && executor.getPoolSize() < executor.getMaximumPoolSize()) {
            int newCore = Math.min(executor.getCorePoolSize() + 2, 30);
            executor.setCorePoolSize(newCore);
            log.info("Auto increased core size to {}", newCore);
        } else if (utilization < 0.2 && executor.getCorePoolSize() > 10) {
            int newCore = Math.max(executor.getCorePoolSize() - 2, 10);
            executor.setCorePoolSize(newCore);
            log.info("Auto decreased core size to {}", newCore);
        }
    }
}
```

## 总结

### 核心要点回顾

1. **没有万能配置**：必须基于实际业务场景调优
2. **监控是基础**：没有度量就没有优化
3. **渐进式调优**：小步快跑，持续优化
4. **虚拟线程不是银弹**：适合IO密集型，不适合CPU密集型
5. **隔离是关键**：关键路径应该有独立的线程池

### 线程池设计决策树

```
开始 → 任务类型？
├─ IO密集型 → JDK版本？
│   ├─ JDK 21+ → 考虑虚拟线程
│   └─ JDK < 21 → 核心数×3，有界队列，CallerRunsPolicy
├─ CPU密集型 → 核心数+1，小队列，AbortPolicy
└─ 混合型 → 分析IO占比 → 按比例配置

需要优先级？→ 是：PriorityBlockingQueue
允许丢失？→ 是：DiscardPolicy / 否：CallerRunsPolicy
需要定时？→ 是：ScheduledThreadPoolExecutor
```

### 经验法则

- **Web应用**：核心数×2 到 核心数×4
- **消息处理**：核心数×3 到 核心数×5
- **批处理**：核心数 到 核心数×2
- **定时任务**：固定大小，通常5-10个线程
- **队列大小**：峰值QPS × 可容忍延迟秒数

记住：这些都是起点，实际配置需要基于监控数据持续调优。
