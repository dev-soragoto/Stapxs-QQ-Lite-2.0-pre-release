import type {
    PluginModule,
    PluginLogger,
    PluginConfigSchema
} from 'napcat-types/napcat-onebot/network/plugin-manger'

let logger: PluginLogger | null = null
const startTime = Date.now()

export let plugin_config_ui: PluginConfigSchema = []

export const plugin_init: PluginModule['plugin_init'] = (ctx) => {
    logger = ctx.logger

    plugin_config_ui = ctx.NapCatConfig.combine(
        ctx.NapCatConfig.html('<div style="padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px; text-align: center;"><p>欢迎使用 Stapxs QQ Lite，请进入扩展页面使用插件</p></div>'),
    )

    ctx.router.static('/static', 'webui/dist')

    ctx.router.page({
        path: 'dashboard',
        title: 'Stapxs QQ Lite',
        icon: '📟',
        htmlFile: 'webui/dist/index.html',
        description: 'Stapxs QQ Lite'
    })

    logger?.info('Stapxs QQ Lite 插件已初始化，耗时：', formatUptime(Date.now() - startTime))
};

function formatUptime(ms: number) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}小时 ${m % 60}分钟`
    if (m > 0) return `${m}分钟 ${s % 60}秒`
    return `${s}秒`
}

export default {
    plugin_init,
}
