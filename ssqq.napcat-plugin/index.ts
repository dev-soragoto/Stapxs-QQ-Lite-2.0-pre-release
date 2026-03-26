import type {
    PluginModule,
    NapCatPluginContext
} from 'napcat-types/napcat-onebot/network/plugin-manger'

export const plugin_init: PluginModule['plugin_init'] = (ctx: NapCatPluginContext) => {
    ctx.router.static('/static', 'webui/dist')

    ctx.router.page({
        path: 'dashboard',
        title: 'Stapxs QQ Lite',
        icon: '📱',
        htmlFile: 'webui/dist/index.html',
        description: 'Stapxs QQ Lite',
    })
};

export default {
    plugin_init,
}
