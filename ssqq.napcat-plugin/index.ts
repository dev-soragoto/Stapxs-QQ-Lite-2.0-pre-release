import path from 'path'
import fs from 'fs'

import type { ActionMap } from 'napcat-types/napcat-onebot/action/index'
import type { PluginModule, PluginLogger, PluginConfigSchema } from 'napcat-types/napcat-onebot/network/plugin-manger'
import type { OB11Message, OB11PostSendMsg } from 'napcat-types/napcat-onebot/types/index'

import { EventType } from 'napcat-types/napcat-onebot/event/index'
import { NetworkAdapterConfig } from 'napcat-types/napcat-onebot/config/config'

let logger: PluginLogger | null = null;
const startTime = Date.now();

interface SSQQConfig {
    prefix?: string;
    enableReply?: boolean;
    [key: string]: unknown;
}

let currentConfig: SSQQConfig = {
    prefix: '#ssqq',
    enableReply: true
};

export let plugin_config_ui: PluginConfigSchema = [];

export const plugin_init: PluginModule['plugin_init'] = async (ctx) => {
    logger = ctx.logger;

    // plugin_config_ui = ctx.NapCatConfig.combine(
    //     ctx.NapCatConfig.text('prefix', '命令前缀', '#ssqq', '触发插件的消息前缀'),
    //     ctx.NapCatConfig.boolean('enableReply', '启用回复', true, '开启或关闭自动回复')
    // );

    // 读取配置
    try {
        if (fs.existsSync(ctx.configPath)) {
            const saved = JSON.parse(fs.readFileSync(ctx.configPath, 'utf-8')) as SSQQConfig;
            Object.assign(currentConfig, saved);
        }
    } catch (e) {
        logger?.warn('加载配置失败', e);
    }

    // 挂载 ssqq 静态资源
    ctx.router.static('/static', 'webui/dist');

    // // API: status
    ctx.router.get('/status', (_req, res) => {
        const uptime = Date.now() - startTime;
        res.json({ code: 0, data: { pluginName: ctx.pluginName, uptime, uptimeFormatted: formatUptime(uptime), config: currentConfig } });
    });

    // ctx.router.get('/config', (_req, res) => {
    //     res.json({ code: 0, data: currentConfig });
    // });

    // ctx.router.post('/config', (req, res) => {
    //     try {
    //         const newCfg = req.body as Partial<SSQQConfig>;
    //         Object.assign(currentConfig, newCfg);
    //         const cfgDir = path.dirname(ctx.configPath);
    //         if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });
    //         fs.writeFileSync(ctx.configPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
    //         res.json({ code: 0, message: '保存成功' });
    //     } catch (e: any) {
    //         res.status(500).json({ code: -1, message: e.message });
    //     }
    // });

    ctx.router.page({
        path: 'dashboard',
        title: 'Stapxs QQ Lite',
        icon: '📟',
        htmlFile: 'webui/dist/index.html',
        description: 'Stapxs QQ Lite'
    });

    logger?.info('Stapxs QQ Lite 插件已初始化，耗时：', formatUptime(Date.now() - startTime));
};

export const plugin_get_config: PluginModule['plugin_get_config'] = async () => {
    return currentConfig;
};

export const plugin_set_config: PluginModule['plugin_set_config'] = async (ctx, config) => {
    currentConfig = config as SSQQConfig;
    if (ctx && ctx.configPath) {
        try {
            const cfgDir = path.dirname(ctx.configPath);
            if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });
            fs.writeFileSync(ctx.configPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
        } catch (e) {
            logger?.error('保存配置失败', e);
            throw e;
        }
    }
};

export const plugin_onmessage: PluginModule['plugin_onmessage'] = async (_ctx, event) => {
    if (currentConfig.enableReply === false) return;
    const prefix = currentConfig.prefix || '#ssqq';
    if (event.post_type !== EventType.MESSAGE || !event.raw_message.startsWith(prefix)) return;

    try {
        const message = `收到 SSQQ 命令：${event.raw_message}`;
        await sendMessage(_ctx.actions, event, message, _ctx.adapterName, _ctx.pluginManager.config);
        logger?.info('已回复 SSQQ 消息');
    } catch (e) {
        logger?.error('处理消息失败', e);
    }
};

export const plugin_config_controller: PluginModule['plugin_config_controller'] = async (_ctx, ui, initialConfig) => {
    logger?.info('配置控制器已初始化', initialConfig);
    // 可在此处根据 initialConfig 动态初始化 UI 控件，例如异步加载数据
    return () => {
        logger?.info('配置控制器已清理');
    };
};

export const plugin_on_config_change: PluginModule['plugin_on_config_change'] = async (_ctx, ui, key, value, _currentConfig) => {
    logger?.info(`配置字段变化: ${key} = ${value}`);
    // 根据需要处理 reactive 字段变化
};

function formatUptime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}小时 ${m % 60}分钟`;
    if (m > 0) return `${m}分钟 ${s % 60}秒`;
    return `${s}秒`;
}

async function sendMessage(actions: ActionMap, event: OB11Message, message: string, adapter: string, config: NetworkAdapterConfig) {
    const params: OB11PostSendMsg = {
        message,
        message_type: event.message_type,
        ...(event.message_type === 'group' && event.group_id ? { group_id: String(event.group_id) } : {}),
        ...(event.message_type === 'private' && event.user_id ? { user_id: String(event.user_id) } : {})
    };

    try {
        await actions.call('send_msg', params, adapter, config);
    } catch (e) {
        logger?.error('发送消息失败', e);
    }
}

export default {
    plugin_init,
    plugin_get_config,
    plugin_set_config,
    plugin_onmessage,
    plugin_config_controller,
    plugin_on_config_change
};
