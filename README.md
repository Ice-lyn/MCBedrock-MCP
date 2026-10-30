# MCBedock-MCP

将 Minecraft 基岩版专用服务器（BDS）的部分信息与操作，以 MCP 工具的形式提供给兼容的 AI 客户端
项目运行在 levilamina 的 Legacy Script Engine Node.js 环境中，通过 HTTP JSON-RPC 提供工具调用
> 近60%为人工手写，辅助模型为dsv4.1f，质量可保证，并且我自己也在用 ovo
> 他主要是给AI群聊机器人准备的MCP lse插件开发用的话我没试过 应该也行?

## 使用

1. 安装这个插件并配置
2. 查看控制台的连接信息，默认地址为 `http://localhost:4839/mcp`
3. 打开你的 AI 应用（如QQ机器人/Agent等）
4. 选择以 HTTP 远程接入，并填写上面那个地址


## MCP 接口

- 调用地址：`http://<服务器地址>:<端口>/mcp`
- 调用方法：`POST`
- 协议版本：`2024-11-05`
- 请求：JSON-RPC 2.0；支持 `initialize`、`tools/list` 和 `tools/call`
- 授权：可选 Bearer Token，见配置章节

当前实现是简单的 HTTP POST JSON-RPC 接口，不提供 SSE，也没有实现完整的 Streamable HTTP 会话流程  
因此，客户端需要支持这种 HTTP JSON-RPC 接入方式  
只支持标准 Streamable HTTP/SSE 的客户端可能无法直接连接，需要使用兼容桥接程序  
项目没有内置 MCP 客户端配置或桥接服务  

## 可用工具

以下工具是否注册取决于 `Config/config.js` 中对应的模块开关；`player_chat` 由 `module.player.chat.enable` 控制。

| 工具 | 用途 |
| --- | --- |
| `server_info` | 查询 BDS 版本、协议版本、天气、游戏时间和数据库玩家数 |
| `server_list` | 查询在线玩家列表 |
| `server_plugins` | 查询已加载的 LLSE 插件列表 |
| `server_locate` | 定位结构或群系 |
| `server_say` | 向所有在线玩家广播消息 |
| `server_runcmd` | 执行服务器后台指令 |
| `player_info` | 查询玩家坐标、生命值、游戏状态、XUID 等信息 |
| `player_device` | 查询玩家 IP、延迟、设备系统、客户端 ID 等信息 |
| `player_tags` | 查询玩家标签 |
| `player_scoreboards` | 查询玩家各计分板分数（支持离线玩家） |
| `player_nbt` | 查询玩家 SNBT 数据（支持离线玩家） |
| `player_chat` | 查询插件启动后收集的聊天、加入和退出记录 |
| `player_query` | 查询数据库中的玩家数据（支持离线及模糊搜索） |
| `player_tell` | 向指定在线玩家发送消息 |

聊天记录最多保留 `maxList` 条，设置为 `-1` 表示不限制
服务重启后，内存中的聊天记录会清空  

## 配置

编辑 `Config/config.js`
默认监听端口为 `4839`，默认监听所有地址

鉴权默认关闭。需要开放给 MCP 客户端时，建议启用鉴权并替换仓库中的示例密钥：

```js
key: {
	enable: true,
	key: "请替换为足够随机且独立的密钥"
}
```

客户端请求需携带请求头：

```http
Authorization: Bearer <你的密钥>
```

其他重要开关：

- `module.server.runcmd` 默认关闭。启用后，调用方可以执行后台指令；仅应对可信客户端开放。
- `module.player.nbt` 默认关闭。NBT 可能包含背包、末影箱等敏感数据。
- `module.player.device` 和 `module.player.chat` 默认启用，会暴露玩家设备信息并记录聊天、加入和退出事件；可按服务器隐私要求关闭。
- 聊天记录上限由 `module.player.chat.maxList` 控制。

## 安全说明

- 服务没有 TLS 加密；不要将端口直接暴露到公网。远程接入请使用受控网络或安全隧道，并限制防火墙访问来源。
- HTTP 服务未指定绑定主机，Node.js 默认会监听可用网络接口。只在本机使用时，也应通过防火墙限制外部访问。
- 启用鉴权后，密钥以明文保存在配置文件中；当前实现还会在启动日志中输出密钥。请保护配置文件和服务器日志，并避免复用其他服务的凭据。
- 玩家 IP、客户端 ID、聊天记录和 NBT 均可能属于敏感数据。只启用实际需要的模块，并限制可调用该服务的客户端。
