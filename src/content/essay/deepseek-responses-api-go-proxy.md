---
title: "DeepSeek 适配 Responses API 的 Go 代理实现"
description: "记录如何用 Go 写一层代理，把 Responses API 风格请求转换成 DeepSeek Chat Completions 请求，并处理文本、流式输出和 function tool 映射。"
date: 2026-06-18
publishedAt: 2026-06-18T17:00:00+08:00
badge: AI
tags:
  - "AI"
  - "DeepSeek"
  - "OpenAI"
  - "Responses API"
  - "Chat Completions"
  - "Go"
  - "Proxy"
  - "Tech"
draft: false
archive: true
slug: deepseek-responses-api-go-proxy
---
## 结论

DeepSeek 官方 API 提供 OpenAI-compatible 的 Chat Completions 风格接口，常用入口是：

```text
POST https://api.deepseek.com/chat/completions
Authorization: Bearer $DEEPSEEK_API_KEY
```

如果客户端只会请求 Responses API 风格的 `POST /responses`，就需要在本地加一层代理：

```text
Client -> POST /responses -> Go proxy -> POST https://api.deepseek.com/chat/completions
```

代理的核心职责不是“改 URL”这么简单，而是把 Responses 的 `input`、`instructions`、`output[]`、typed SSE events 和 function call item 转成 Chat Completions 的 `messages[]`、`choices[]`、`chat.completion.chunk` 和 `tool_calls[]`。

协议总览可以先看：[Responses API 与 Chat Completions 协议对比](/archive/responses-api-chat-completions-protocol/)

## 适配边界

最小可用代理建议先支持这些能力：

| 能力 | 处理方式 |
|---|---|
| 普通文本输入 | `input` 转 `messages[]` |
| 顶层指令 | `instructions` 转 `system` message |
| 文本输出 | `choices[0].message.content` 包成 Responses `output_text` |
| 流式文本 | Chat chunk 的 `delta.content` 转 `response.output_text.delta` |
| Function tools | Responses flat tool 转 Chat `tools[].function` |
| Tool call | Chat `tool_calls[]` 转 Responses `function_call` item |
| Tool result | Responses `function_call_output` 转 Chat `role=tool` message |

先不要承诺这些能力无损：

- Responses 内置工具，例如 web search、file search、computer use、MCP tool。
- 多模态输入，例如 `input_image`、`input_file`。
- reasoning item 的完整保留。
- 使用 `previous_response_id` 时的完整状态恢复。若客户端下一轮只发 `function_call_output`，代理必须能从本地状态库查回上一轮 assistant `tool_calls[]`。

## 请求转换规则

| Responses 入参 | DeepSeek Chat 入参 | 说明 |
|---|---|---|
| `model` | `model` | 可直接映射，例如 `deepseek-v4-pro` |
| `instructions` | `messages[0].role = "system"` | 兼容 OpenAI-style provider 时比 `developer` 更稳 |
| `input: "text"` | `{ role: "user", content: "text" }` | 字符串 input 默认是 user 输入 |
| `input[].type = "message"` | `messages[]` | `content[].input_text` 合并成文本 |
| `max_output_tokens` | `max_tokens` | DeepSeek Chat Completion 文档使用 `max_tokens` |
| `stream` | `stream` | 传给上游，但 SSE 输出事件要重包 |
| `tools[].name` | `tools[].function.name` | Responses tool 是扁平结构 |
| `tools[].strict` | `tools[].function.strict` | DeepSeek function calling 支持 strict mode |

## Tool call 映射

Responses tool 定义：

```json
{
  "type": "function",
  "name": "get_weather",
  "description": "Get weather",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string" }
    },
    "required": ["city"],
    "additionalProperties": false
  },
  "strict": true
}
```

转成 DeepSeek Chat tool：

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get weather",
    "parameters": {
      "type": "object",
      "properties": {
        "city": { "type": "string" }
      },
      "required": ["city"],
      "additionalProperties": false
    },
    "strict": true
  }
}
```

模型发起工具调用时：

```text
Chat choices[0].message.tool_calls[]
-> Responses output[] function_call item
```

工具结果回传时：

```text
Responses input[] function_call_output
-> Chat messages[] role=tool + tool_call_id
```

关键点：`call_id` / `tool_call_id` 必须稳定，否则模型无法把工具结果和上一轮工具调用对上。

## Go 核心代码

下面是核心代理逻辑，聚焦协议转换。生产环境需要补齐鉴权、日志、超时、错误码映射、状态存储和多模态处理。

```go
package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

const upstreamURL = "https://api.deepseek.com/chat/completions"

type ResponsesRequest struct {
	Model            string          `json:"model"`
	Instructions     string          `json:"instructions,omitempty"`
	Input            json.RawMessage `json:"input,omitempty"`
	Stream           bool            `json:"stream,omitempty"`
	MaxOutputTokens  int             `json:"max_output_tokens,omitempty"`
	Tools            []ResponseTool  `json:"tools,omitempty"`
	ToolChoice       any             `json:"tool_choice,omitempty"`
	PreviousResponse string          `json:"previous_response_id,omitempty"`
}

type ResponseTool struct {
	Type        string          `json:"type"`
	Name        string          `json:"name,omitempty"`
	Description string          `json:"description,omitempty"`
	Parameters  json.RawMessage `json:"parameters,omitempty"`
	Strict      *bool           `json:"strict,omitempty"`
}

type ChatRequest struct {
	Model      string        `json:"model"`
	Messages   []ChatMessage `json:"messages"`
	Stream     bool          `json:"stream,omitempty"`
	MaxTokens  int           `json:"max_tokens,omitempty"`
	Tools      []ChatTool    `json:"tools,omitempty"`
	ToolChoice any           `json:"tool_choice,omitempty"`
}

type ChatMessage struct {
	Role       string     `json:"role"`
	Content    any        `json:"content,omitempty"`
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
}

type ChatTool struct {
	Type     string       `json:"type"`
	Function ChatFunction `json:"function"`
}

type ChatFunction struct {
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	Parameters  json.RawMessage `json:"parameters,omitempty"`
	Strict      *bool           `json:"strict,omitempty"`
}

type ToolCall struct {
	ID       string           `json:"id"`
	Type     string           `json:"type"`
	Function ToolCallFunction `json:"function"`
}

type ToolCallFunction struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

func main() {
	http.HandleFunc("/responses", handleResponses)
	log.Fatal(http.ListenAndServe(":8787", nil))
}

func handleResponses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ResponsesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	chatReq, err := toChatRequest(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Stream {
		proxyChatStream(r.Context(), w, chatReq, req.Model)
		return
	}

	resp, err := callDeepSeek(r.Context(), chatReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	out := chatToResponses(resp, req.Model)
	writeJSON(w, out)
}

func toChatRequest(req ResponsesRequest) (ChatRequest, error) {
	var messages []ChatMessage

	if strings.TrimSpace(req.Instructions) != "" {
		messages = append(messages, ChatMessage{
			Role:    "system",
			Content: req.Instructions,
		})
	}

	inputMessages, err := responsesInputToMessages(req.Input)
	if err != nil {
		return ChatRequest{}, err
	}
	messages = append(messages, inputMessages...)

	tools := make([]ChatTool, 0, len(req.Tools))
	for _, t := range req.Tools {
		if t.Type != "function" {
			continue
		}
		tools = append(tools, ChatTool{
			Type: "function",
			Function: ChatFunction{
				Name:        t.Name,
				Description: t.Description,
				Parameters:  t.Parameters,
				Strict:      t.Strict,
			},
		})
	}

	return ChatRequest{
		Model:      req.Model,
		Messages:   messages,
		Stream:     req.Stream,
		MaxTokens:  req.MaxOutputTokens,
		Tools:      tools,
		ToolChoice: req.ToolChoice,
	}, nil
}

func responsesInputToMessages(raw json.RawMessage) ([]ChatMessage, error) {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 || bytes.Equal(raw, []byte("null")) {
		return nil, nil
	}

	if raw[0] == '"' {
		var text string
		if err := json.Unmarshal(raw, &text); err != nil {
			return nil, err
		}
		return []ChatMessage{{Role: "user", Content: text}}, nil
	}

	var items []map[string]json.RawMessage
	if err := json.Unmarshal(raw, &items); err != nil {
		return nil, fmt.Errorf("unsupported responses input shape: %w", err)
	}

	var messages []ChatMessage
	for _, item := range items {
		var typ string
		_ = json.Unmarshal(item["type"], &typ)

		switch typ {
		case "message":
			var role string
			_ = json.Unmarshal(item["role"], &role)
			text, err := extractTextContent(item["content"])
			if err != nil {
				return nil, err
			}
			messages = append(messages, ChatMessage{Role: role, Content: text})

		case "function_call_output":
			var callID, output string
			_ = json.Unmarshal(item["call_id"], &callID)
			_ = json.Unmarshal(item["output"], &output)
			messages = append(messages, ChatMessage{
				Role:       "tool",
				ToolCallID: callID,
				Content:    output,
			})

		case "function_call":
			var callID, name, args string
			_ = json.Unmarshal(item["call_id"], &callID)
			_ = json.Unmarshal(item["name"], &name)
			_ = json.Unmarshal(item["arguments"], &args)
			messages = append(messages, ChatMessage{
				Role:    "assistant",
				Content: nil,
				ToolCalls: []ToolCall{{
					ID:   callID,
					Type: "function",
					Function: ToolCallFunction{
						Name:      name,
						Arguments: args,
					},
				}},
			})
		}
	}

	return messages, nil
}

func extractTextContent(raw json.RawMessage) (string, error) {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return "", nil
	}
	if raw[0] == '"' {
		var s string
		return s, json.Unmarshal(raw, &s)
	}

	var parts []map[string]json.RawMessage
	if err := json.Unmarshal(raw, &parts); err != nil {
		return "", err
	}

	var b strings.Builder
	for _, p := range parts {
		var typ string
		_ = json.Unmarshal(p["type"], &typ)
		switch typ {
		case "input_text", "text":
			var text string
			_ = json.Unmarshal(p["text"], &text)
			b.WriteString(text)
		default:
			return "", fmt.Errorf("unsupported content part type %q in minimal adapter", typ)
		}
	}
	return b.String(), nil
}

func callDeepSeek(ctx context.Context, req ChatRequest) (map[string]any, error) {
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, upstreamURL, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("DEEPSEEK_API_KEY"))

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		data, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("deepseek status %d: %s", resp.StatusCode, string(data))
	}

	var out map[string]any
	return out, json.NewDecoder(resp.Body).Decode(&out)
}

func chatToResponses(chat map[string]any, model string) map[string]any {
	respID := "resp_" + stringValue(chat["id"])
	output := []any{}

	if choices, ok := chat["choices"].([]any); ok && len(choices) > 0 {
		choice, _ := choices[0].(map[string]any)
		msg, _ := choice["message"].(map[string]any)

		if content := stringValue(msg["content"]); content != "" {
			output = append(output, map[string]any{
				"id":     "msg_" + respID,
				"type":   "message",
				"role":   "assistant",
				"status": "completed",
				"content": []any{map[string]any{
					"type":        "output_text",
					"text":        content,
					"annotations": []any{},
				}},
			})
		}

		if calls, ok := msg["tool_calls"].([]any); ok {
			for _, raw := range calls {
				call, _ := raw.(map[string]any)
				fn, _ := call["function"].(map[string]any)
				output = append(output, map[string]any{
					"type":      "function_call",
					"id":        "fc_" + stringValue(call["id"]),
					"call_id":   stringValue(call["id"]),
					"name":      stringValue(fn["name"]),
					"arguments": stringValue(fn["arguments"]),
					"status":    "completed",
				})
			}
		}
	}

	return map[string]any{
		"id":         respID,
		"object":     "response",
		"created_at": time.Now().Unix(),
		"model":      model,
		"status":     "completed",
		"output":     output,
		"usage":      chatUsageToResponses(chat["usage"]),
	}
}

func proxyChatStream(ctx context.Context, w http.ResponseWriter, req ChatRequest, model string) {
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, upstreamURL, bytes.NewReader(body))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("DEEPSEEK_API_KEY"))

	up, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	defer up.Body.Close()

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")

	respID := "resp_" + fmt.Sprint(time.Now().UnixNano())
	emitSSE(w, "response.created", map[string]any{
		"type": "response.created",
		"response": map[string]any{
			"id":     respID,
			"object": "response",
			"status": "in_progress",
			"model":  model,
		},
	})

	var text strings.Builder
	textItemStarted := false

	scanner := bufio.NewScanner(up.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if json.Unmarshal([]byte(data), &chunk) != nil || len(chunk.Choices) == 0 {
			continue
		}

		delta := chunk.Choices[0].Delta.Content
		if delta == "" {
			continue
		}

		if !textItemStarted {
			textItemStarted = true
			emitSSE(w, "response.output_item.added", map[string]any{
				"type":         "response.output_item.added",
				"output_index": 0,
				"item": map[string]any{
					"id":      "msg_" + respID,
					"type":    "message",
					"role":    "assistant",
					"status":  "in_progress",
					"content": []any{},
				},
			})
		}

		text.WriteString(delta)
		emitSSE(w, "response.output_text.delta", map[string]any{
			"type":          "response.output_text.delta",
			"output_index":  0,
			"content_index": 0,
			"delta":         delta,
		})
	}

	if textItemStarted {
		emitSSE(w, "response.output_text.done", map[string]any{
			"type":          "response.output_text.done",
			"output_index":  0,
			"content_index": 0,
			"text":          text.String(),
		})
		emitSSE(w, "response.output_item.done", map[string]any{
			"type":         "response.output_item.done",
			"output_index": 0,
			"item": map[string]any{
				"id":     "msg_" + respID,
				"type":   "message",
				"role":   "assistant",
				"status": "completed",
				"content": []any{map[string]any{
					"type":        "output_text",
					"text":        text.String(),
					"annotations": []any{},
				}},
			},
		})
	}

	emitSSE(w, "response.completed", map[string]any{
		"type": "response.completed",
		"response": map[string]any{
			"id":     respID,
			"object": "response",
			"status": "completed",
			"model":  model,
		},
	})
}

func emitSSE(w http.ResponseWriter, event string, payload any) {
	data, _ := json.Marshal(payload)
	fmt.Fprintf(w, "event: %s\n", event)
	fmt.Fprintf(w, "data: %s\n\n", data)
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func stringValue(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}

func chatUsageToResponses(v any) map[string]any {
	u, _ := v.(map[string]any)
	return map[string]any{
		"input_tokens":  u["prompt_tokens"],
		"output_tokens": u["completion_tokens"],
		"total_tokens":  u["total_tokens"],
	}
}
```

## Tool call 流式补充

上面的 `proxyChatStream` 只演示文本流。如果要完整支持流式工具调用，需要额外处理 DeepSeek Chat chunk 中的：

```text
choices[0].delta.tool_calls[].id
choices[0].delta.tool_calls[].function.name
choices[0].delta.tool_calls[].function.arguments
```

对应输出 Responses typed events：

```text
response.output_item.added            function_call item 开始
response.function_call_arguments.delta 累计 arguments 片段
response.function_call_arguments.done  arguments 完整 JSON 字符串
response.output_item.done              function_call item 完成
```

实现要点：

1. 以 `delta.tool_calls[].index` 为 key 缓存每个工具调用。
2. 首次看到某个 index 时发 `response.output_item.added`。
3. 每次收到 `function.arguments` 片段时发 `response.function_call_arguments.delta`，同时追加到 `strings.Builder`。
4. 上游 `[DONE]` 或 finish reason 到达后，发 `response.function_call_arguments.done` 和 `response.output_item.done`。

## previous_response_id 的状态问题

Responses API 可以用 `previous_response_id` 做跨轮状态衔接。DeepSeek Chat Completions 没有等价字段，它要求你把对话历史重新放进 `messages[]`。

因此代理有两种实现方式：

| 方式 | 说明 |
|---|---|
| 客户端每轮都传完整上下文 | 代理只做协议转换，不存状态，最简单 |
| 代理保存 response state | 代理维护 `response_id -> assistant messages/tool_calls`，下一轮看到 `previous_response_id` 时恢复上下文 |

如果要兼容只发送 `function_call_output + previous_response_id` 的客户端，必须实现第二种。否则工具结果会缺少上一轮 assistant `tool_calls[]`，DeepSeek 上游无法知道这个 `tool_call_id` 对应哪个工具调用。

## 本地运行

```bash
export DEEPSEEK_API_KEY="sk-..."
go run deepseek-responses-proxy.go
```

测试非流式：

```bash
curl http://localhost:8787/responses \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v4-pro",
    "instructions": "You are concise.",
    "input": "Reply with OK only."
  }'
```

测试流式：

```bash
curl -N http://localhost:8787/responses \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v4-pro",
    "input": "Count from 1 to 3.",
    "stream": true
  }'
```

## 常见坑

- `https://api.deepseek.com/responses` 不是 DeepSeek Chat Completions 端点；如果直接请求，大概率会得到 404。
- DeepSeek 的 OpenAI-compatible Chat 路径是 `/chat/completions`。
- `max_output_tokens` 要转成 `max_tokens`。
- function tool 的 `strict` 在 Chat Completions 里放在 `tools[].function.strict`。
- `function_call_output.call_id` 必须转成 `tool_call_id`。
- 如果只做文本代理，Codex/Agent 类客户端一旦开始使用工具调用，协议就会断，需要优先补齐 tool call 生命周期。

## 参考

- [DeepSeek Your First API Call](https://api-docs.deepseek.com/)
- [DeepSeek Create Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion)
- [DeepSeek Function Calling](https://api-docs.deepseek.com/guides/function_calling)
- [OpenAI Responses API - Create a response](https://developers.openai.com/api/reference/resources/responses/methods/create/)
- [OpenAI Chat Completions API - Create chat completion](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create/)
- [Responses API 与 Chat Completions 协议对比](/archive/responses-api-chat-completions-protocol/)
