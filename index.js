// import
/// <reference path="/root/VSCode/Library/lse/index.d.ts" />
import { createServer } from 'node:http';
import config from "./Config/config.js";

const TOOLS = new Map();

addTool("test",
    "aaaaaaaa",
    { type: 'object', properties: {} },
    () => "aaaaaaassssss"
)


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