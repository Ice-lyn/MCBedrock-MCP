// import
/// <reference path="/root/VSCode/Library/lse/index.d.ts" />
import { createServer } from 'node:http';
import * as i18n from "./Config/i18n.js";
import config from "./Config/config.js";

const TOOLS = new Map();

// // 非BDS使用模拟
// if (typeof mc === "undefined") {
//     var mc = {
//         runcmdEx: (...data) => `run cmd -> ${data}`,
//         getPlayer: () => { },
//         getAllScoreObjectives: (...data) => ["积分榜", "aaa", "bbb"]
//     }
// }



// === 服务器相关 === //
{
    const cfg = config.module.server;
    if (cfg.list)
        addTool("server_list",
            "获取服务器在线玩家列表",
            { type: 'object', properties: {} },
            () => mc.runcmdEx("list")
        );

    if (cfg.locate)
        addTool("server_locate",
            "在服务器中定位结构或群系",
            {
                type: 'object',
                properties: {
                    mode: {
                        type: "string",
                        description: "查询模式",
                        enum: ["structure", "biome"],
                    },
                    id: {
                        type: "string",
                        description: "结构或群系id，如end_city",
                    },

                    new_chunk: {
                        type: "boolean",
                        description: "仅在未生成的区块中定位",
                    },
                    pos_x: {
                        type: "string",
                        default: "0",
                        description: "定位起始点x坐标",
                    },
                    pos_y: {
                        type: "string",
                        default: "0",
                        description: "定位起始点y坐标",
                    },
                    pos_z: {
                        type: "string",
                        default: "0",
                        description: "定位起始点z坐标",
                    },
                    pos_dim: {
                        type: "string",
                        default: "overworld",
                        enum: ["overworld", "nether", "the_end"],
                        description: "定位起始点维度坐标",
                    },
                },
                required: ["mode", "id", "new_chunk", "pos_dim", "pos_x", "pos_y", "pos_z"]
            },
            ({ mode, id, new_chunk, pos_dim, pos_x, pos_y, pos_z }) =>
                mc.runcmdEx(`execute in ${pos_dim} positioned ${pos_x} ${pos_y} ${pos_z} run locate ${mode} ${id} ${new_chunk}`)
        );

    if (cfg.plugin)
        addTool("server_plugins",
            "获取服务器已加载插件列表",
            { type: 'object', properties: {} },
            () => mc.runcmdEx("ll list")
        );

    if (cfg.runcmd)
        addTool("server_runcmd",
            "运行服务器后台指令，慎用",
            {
                type: 'object',
                properties: {
                    cmd: {
                        type: "string",
                        description: "规范的MC基岩版指令",
                    },
                }
            },
            ({ cmd }) => mc.runcmdEx(cmd)
        );

    if (cfg.say)
        addTool("server_say",
            "向服务器所有在线玩家广播",
            {
                type: 'object',
                properties: {
                    text: {
                        type: "string",
                        description: "消息",
                    }
                }
            },
            ({ msg }) => mc.runcmdEx(`say ${msg}`)
        );
}

// === 玩家相关 === //
{
    const cfg = config.module.player;
    if (cfg.device)
        addTool("player_device",
            "获取玩家的设备信息，如IP/延迟/连接地址/客户端识别码等",
            {
                type: 'object',
                properties: {
                    name: {
                        type: "string",
                        description: "玩家名",
                    }
                }
            },
            ({ name }) => {
                const dev = mc.getPlayer(name).getDevice();
                let data = {};

                Object.entries(i18n.device).forEach(obj => {
                    data[obj] = dev?.[obj] ?? null;
                });

                return data;
            }
        );

    if (cfg.info)
        addTool("player_info",
            "获取玩家的游戏内信息，如坐标/生命值/xuid等等",
            {
                type: 'object',
                properties: {
                    name: {
                        type: "string",
                        description: "玩家名",
                    }
                }
            },
            ({ name }) => {
                const player = mc.getPlayer(name);
                let data = {};

                Object.entries(i18n.info).forEach(obj => {
                    data[obj] = player?.[obj] ?? null;
                });

                return data;
            }
        );

    if (cfg.tags)
        addTool("player_tags",
            "获取玩家的所有标签",
            {
                type: 'object',
                properties: {
                    name: {
                        type: "string",
                        description: "玩家名",
                    }
                }
            },
            ({ name }) => mc.getPlayer(name)?.getAllTags() ?? []
        );

    if (cfg.scoreboards)
        addTool("player_scoreboards",
            "获取玩家的所有计分板数据",
            {
                type: 'object',
                properties: {
                    name: {
                        type: "string",
                        description: "玩家名",
                    }
                }
            },
            ({ name }) => {
                const player = mc.getPlayer(name);
                let data = {};
                mc.getAllScoreObjectives().forEach(name => {
                    data[name] = player.getScore(name) ?? 0;
                });
                return data;
            }
        );

    if (cfg.nbt)
        addTool("player_nbt",
            "获取玩家的NBT数据",
            {
                type: 'object',
                properties: {
                    name: {
                        type: "string",
                        description: "玩家名",
                    },
                    space: {
                        type: "number",
                        description: "格式化输出的空格数",
                        "minimum": 0,
                        "maximum": 10,
                    }
                }
            },
            ({ name, space }) => mc.getPlayer(name).getNbt().toSNBT(space)
        );

    if (cfg.chat.enable) {
        const chatList = [];
        const addChat = (msg) => chatList.push(`[${new Date().toLocaleString('zh-CN', { hour12: false })}]${msg}`);

        if (cfg.chat.chat)
            mc.listen("onChat", (player, msg) => {
                msg = `[${{ 0: "主世界", 1: "下界", 2: "末地" }[player.pos.dimid] || "未知"}]`
                    + `${player.getDevice()?.avgPing > 100 ? `[${player.getDevice().avgPing}ms]` : ""}`
                    + `${player.realName} >> ${msg}`;

                if (cfg.chat.maxList >= 0 && chatList.length > cfg.chat.maxList)
                    chatList.shift();
                addChat(msg);
            })

        if (cfg.chat.join)
            mc.listen("onJoin", (player) => addChat(`${player.realName} 加入了游戏`));

        if (cfg.chat.left)
            mc.listen("onLeft", (player) => addChat(`${player.realName} 退出了游戏`));

        addTool("player_chat",
            "获取所有聊天消息",
            { type: 'object', properties: {} },
            () => chatList.join("\n")
        );
    };
}


// === MCP Server 逻辑区 === //

/**
 * 注册工具函数
 * @param {string} name - 工具的唯一名称标识
 * @param {string} description - 工具的功能描述（用于告知调用方用途）
 * @param {Object} inputSchema - 工具的输入参数结构定义（JSON Schema格式）
 * @param {Function} handler - 工具的执行处理函数
 */
function addTool(name, description, inputSchema, handler) {
    if (TOOLS.has(name)) throw new Error(`Tool already exists: ${name}`);
    TOOLS.set(name, { name, description, inputSchema, handler });
}

function checkAuth(req) {
    if (!config.key.enable) return true;

    const header = req.headers.authorization;
    if (!header) return false;
    // 严格匹配 "Bearer <token>"，大小写不敏感但格式必须完整
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return false;
    return match[1] === config.key.key;
}

// HTTP Server
const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/mcp') {
        res.writeHead(404).end();
        return;
    }

    // 鉴权
    if (!checkAuth(req)) {
        res.writeHead(401, {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="mcp-server"',
        });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;

    let msg;
    try {
        msg = JSON.parse(body);
    } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            jsonrpc: '2.0', id: null,
            error: { code: -32700, message: 'Parse error' },
        }));
    }

    // 通知类消息直接确认
    if (msg.id === undefined) {
        res.writeHead(202).end();
        return;
    }

    const { id, method, params } = msg;
    let result;

    switch (method) {
        case 'initialize':
            result = {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'mini-mcp', version: '0.2.0' },
            };
            break;

        case 'tools/list':
            // 将 Map 转为数组，只暴露协议字段，不暴露 handler
            result = {
                tools: [...TOOLS.values()].map(({ name, description, inputSchema }) => ({
                    name, description, inputSchema,
                })),
            };
            break;

        case 'tools/call': {
            const tool = TOOLS.get(params.name);
            if (!tool) {
                return res.end(JSON.stringify({
                    jsonrpc: '2.0', id,
                    error: { code: -32602, message: `Unknown tool: ${params.name}` },
                }));
            }
            try {
                result = await tool.handler(params.arguments ?? {});
                result = (
                    // 不关心多模态消息 错误返回text
                    (result !== null && !Array.isArray(result) && typeof result == "object")
                        ? { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result }
                        : { content: [{ type: 'text', text: `${result}` }] }
                )
            } catch (e) {
                console.error(e)
                return res.end(JSON.stringify({
                    jsonrpc: '2.0', id,
                    error: { code: -32603, message: e.message },
                    isError: true, content: [{ type: 'text', text: `${e}` }],
                }));
            }
            break;
        }

        default:
            return res.end(JSON.stringify({
                jsonrpc: '2.0', id,
                error: { code: -32601, message: `Method not found: ${method}` },
            }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
});

server.listen(config.port, () => {
    console.log(`MCP server on http://localhost:${config.port}/mcp`);
    console.log('Token:', config.key.key);
});