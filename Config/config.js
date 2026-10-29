export const config = {
    host: "0.0.0.0", // 监听地址
    port: 4839, // 监听端口

    // 鉴权配置
    key: {
        enable: false, // 是否启用
        key: "sk-KFCcrazyDay4Vme50quickly" // 密钥
    },

    // 模块配置
    module: {

        // 服务器相关
        server: {
            info: true, // 服务器信息(版本/游戏时间/游戏天气等)
            list: true, // 玩家列表
            plugin: true, // 插件列表

            locate: true, // 结构或群系查询
            say: true, // 向所有在线玩家发送消息，同等与后台say命令
            runcmd: false, // 运行后台命令 不建议开启
        },

        // 玩家相关
        player: {
            info: true, // 玩家游戏内数据（坐标/生命值/xuid等）
            device: true, // 玩家设备数据(IP/延迟/连接地址/客户端识别码等)
            tags: true, // 玩家所有标签查询
            scoreboards: true, // 玩家所有积分榜查询 (支持离线玩家)

            // 玩家nbt查询
            // 支持离线玩家
            // 他会返回较大的敏感数据！
            // 包括背包/末影箱/标签/生物事件/技能列表等
            nbt: false,

            // 聊天记录查询
            chat: {
                enable: true, // 是否启用
                join: true, // 玩家加入消息
                left: true, // 玩家退出消息
                chat: true, // 玩家聊天消息
                maxList: 200, // 最大记录数，为-1时记录所有
            },
        },


    }
};

export default config;