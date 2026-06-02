---
title: "Spring Boot 多 RabbitMQ 连接集成指南"
description: "详解如何在 Spring Boot 应用中同时连接多个 RabbitMQ 实例，解决企业级应用中需要对接多个消息队列系统的实际问题"
date: 2024-11-05
publishedAt: 2024-11-05T16:00:00+08:00
badge: Java
tags:
  - "Spring Boot"
  - "RabbitMQ"
  - "Message Queue"
  - "Tech"
  - "Spring"
draft: false
archive: true
---
## 问题背景

在企业级开发中，我们经常遇到这样的场景：系统已经使用了自己的 RabbitMQ 处理核心业务，但又需要对接第三方系统的 RabbitMQ。由于 Spring Boot 默认只支持单个 RabbitMQ 连接配置，直接添加第二个连接会导致配置冲突。

本文将详细介绍如何优雅地解决这个问题。

## 核心思路

Spring Boot 默认只支持单个 RabbitMQ 连接，当需要对接多个 RabbitMQ 时，核心思路是：

1. **保留默认配置**：主业务继续使用 Spring Boot 的默认 RabbitMQ 配置
2. **自定义额外连接**：为每个额外的 RabbitMQ 创建独立的 ConnectionFactory、RabbitTemplate 和 ListenerContainerFactory
3. **Bean 隔离**：使用 `@Qualifier` 注解区分不同的 RabbitMQ Bean
4. **指定连接源**：在发送消息和监听消息时明确指定使用哪个 RabbitMQ 连接

## 实战案例：对接两个 RabbitMQ

假设我们的系统需要：
- **主 RabbitMQ**：处理核心业务消息
- **第三方 RabbitMQ**：对接外部系统消息

### 1. 配置文件

```yaml
# 主 RabbitMQ（默认）
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: admin
    password: admin123
    virtual-host: /

# 第三方 RabbitMQ
third-party:
  rabbitmq:
    host: 192.168.1.100
    port: 5672
    username: guest
    password: guest
    virtual-host: /external
```

### 2. 第三方 RabbitMQ 配置类

```java
@Configuration
@ConfigurationProperties(prefix = "third-party.rabbitmq")
@Data
public class ThirdPartyRabbitConfig {
    
    private String host;
    private int port;
    private String username;
    private String password;
    private String virtualHost;
    
    /**
     * 第三方 RabbitMQ 连接工厂
     */
    @Bean("thirdPartyConnectionFactory")
    public ConnectionFactory thirdPartyConnectionFactory() {
        CachingConnectionFactory factory = new CachingConnectionFactory();
        factory.setHost(host);
        factory.setPort(port);
        factory.setUsername(username);
        factory.setPassword(password);
        factory.setVirtualHost(virtualHost);
        return factory;
    }
    
    /**
     * 第三方 RabbitMQ 发送模板
     */
    @Bean("thirdPartyRabbitTemplate")
    public RabbitTemplate thirdPartyRabbitTemplate(
            @Qualifier("thirdPartyConnectionFactory") ConnectionFactory connectionFactory) {
        return new RabbitTemplate(connectionFactory);
    }
    
    /**
     * 第三方 RabbitMQ 监听器工厂
     */
    @Bean("thirdPartyListenerFactory")
    public SimpleRabbitListenerContainerFactory thirdPartyListenerFactory(
            @Qualifier("thirdPartyConnectionFactory") ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        return factory;
    }
}
```

### 3. 消息发送：指定不同的 RabbitMQ

```java
@Service
@Slf4j
public class MessageSender {

    // 主 RabbitMQ（默认）
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    // 第三方 RabbitMQ
    @Autowired
    @Qualifier("thirdPartyRabbitTemplate")
    private RabbitTemplate thirdPartyRabbitTemplate;

    /**
     * 发送到主 RabbitMQ
     */
    public void sendToMain(String exchange, String routingKey, Object message) {
        rabbitTemplate.convertAndSend(exchange, routingKey, message);
        log.info("发送到主RabbitMQ: {}", message);
    }

    /**
     * 发送到第三方 RabbitMQ
     */
    public void sendToThirdParty(String exchange, String routingKey, Object message) {
        thirdPartyRabbitTemplate.convertAndSend(exchange, routingKey, message);
        log.info("发送到第三方RabbitMQ: {}", message);
    }
}
```

### 4. 消息监听：指定不同的 RabbitMQ

```java
@Component
@Slf4j
public class MessageListener {

    /**
     * 监听主 RabbitMQ（使用默认工厂）
     */
    @RabbitListener(queues = "main.queue")
    public void handleMainMessage(String message) {
        log.info("收到主系统消息: {}", message);
        // 处理主业务逻辑
    }

    /**
     * 监听第三方 RabbitMQ（指定工厂）
     */
    @RabbitListener(
        queues = "external.queue",
        containerFactory = "thirdPartyListenerFactory"  // 关键：指定监听器工厂
    )
    public void handleThirdPartyMessage(String message) {
        log.info("收到第三方消息: {}", message);
        // 处理第三方消息
    }
}
```

### 5. 使用示例

```java
@RestController
public class TestController {

    @Autowired
    private MessageSender messageSender;

    @PostMapping("/send-main")
    public String sendToMain() {
        messageSender.sendToMain("main.exchange", "main.key", "Hello Main!");
        return "发送到主RabbitMQ成功";
    }

    @PostMapping("/send-third-party")
    public String sendToThirdParty() {
        messageSender.sendToThirdParty("external.exchange", "external.key", "Hello External!");
        return "发送到第三方RabbitMQ成功";
    }
}
```

## 核心要点

1. **Bean 命名**：为每个额外的 RabbitMQ 连接创建带前缀的 Bean（如 `thirdPartyConnectionFactory`）
2. **发送消息**：注入对应的 `RabbitTemplate`，使用 `@Qualifier` 区分
3. **监听消息**：在 `@RabbitListener` 中指定 `containerFactory` 参数
4. **配置隔离**：每个 RabbitMQ 使用独立的配置，互不影响

## 扩展到更多 RabbitMQ

如果需要对接更多 RabbitMQ，按照相同模式：

1. 在配置文件中添加新的连接参数
2. 创建新的配置类，定义 `ConnectionFactory`、`RabbitTemplate`、`ListenerContainerFactory`
3. 在代码中使用 `@Qualifier` 指定具体的 Bean

这样可以在一个 Spring Boot 应用中同时连接任意数量的 RabbitMQ 实例，每个连接完全独立，互不干扰。

## 实际应用场景

- **多租户系统**：不同租户使用不同的 RabbitMQ 实例
- **第三方集成**：对接外部供应商的消息队列系统
- **环境隔离**：开发、测试、生产环境使用不同的 RabbitMQ
- **业务隔离**：核心业务和日志、监控使用独立的消息队列

## 总结

通过本文介绍的方法，我们可以轻松解决 Spring Boot 应用中多 RabbitMQ 连接的问题。关键在于理解 Spring 的 Bean 管理机制，合理使用 `@Qualifier` 注解进行 Bean 隔离，确保每个 RabbitMQ 连接独立工作。

这种方案具有良好的扩展性，可以根据实际业务需求灵活添加更多的 RabbitMQ 连接，是企业级应用中处理多消息队列集成的最佳实践。
