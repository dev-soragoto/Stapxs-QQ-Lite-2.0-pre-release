<!--
 * @FileDescription: 设置页面（开发者子页面）
 * @Author: Stapxs
 * @Date: 2022/09/28
 * @Version: 1.0
-->

<template>
    <div class="opt-page">
        <div class="ss-card">
            <header>{{ $t('兼容选项') }}</header>
            <div class="tip">
                {{
                    $t(
                        '这儿是兼容性相关的高级选项，这些选项通常会自动识别，如果出现了不正确的情况你也可以手动调整。',
                    )
                }}
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'clipboard-list']" />
                <div>
                    <span>{{ $t('消息类型') }}</span>
                    <span>{{
                        $t(
                            '[CQ:faceid=1]你好啊👋，这个选项将会强制覆盖自动检测',
                        )
                    }}</span>
                </div>
                <select
                    v-model="runtimeData.sysConfig.msgType"
                    name="msg_type"
                    title="msg_type"
                    @change="save">
                    <option
                        v-for="item in Object.values(BotMsgType)
                            .filter(value => typeof value === 'number')"
                        :key="item"
                        :value="item">
                        {{ getBotTypeName(item) }}
                    </option>
                </select>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'gear']" />
                <div>
                    <span>{{ $t('解析配置') }}</span>
                    <span>{{
                        $t('不同框架之间的化学反应我们将其称之为达利园效应')
                    }}</span>
                </div>
                <select
                    v-model="jsonMapName"
                    @change="changeJsonMap">
                    <option
                        v-if="jsonMapName == ''"
                        value="">
                        {{ $t('未连接') }}
                    </option>
                    <option
                        v-for="item in getPathMapList()"
                        :key="item"
                        :value="item">
                        {{ item.replace('Chat', '') }}
                    </option>
                </select>
            </div>
        </div>

        <div class="ss-card">
            <header>{{ $t('开发者选项') }}</header>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'book']" />
                <div>
                    <span>{{ $t('日志等级') }}</span>
                    <span>{{ $t('ReferenceError: moYu is not defined') }}</span>
                </div>
                <select
                    v-model="runtimeData.sysConfig.log_level"
                    name="log_level"
                    title="log_level"
                    @change="save">
                    <option value="err">
                        {{ $t('错误') }}
                    </option>
                    <option value="debug">
                        {{ $t('调试') }}
                    </option>
                    <option value="info">
                        {{ $t('基本') }}
                    </option>
                    <option value="all">
                        {{ $t('全部') }}
                    </option>
                </select>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'robot']" />
                <div>
                    <span>{{ $t('禁用消息渲染') }}</span>
                    <span><a
                        style="cursor: pointer"
                        @click="sendAbab">{{
                        $t('点击进行 CAPTCHA 验证')
                    }}</a></span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.debug_msg"
                        type="checkbox"
                        name="debug_msg"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('调试') }}</header>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'paper-plane']" />
                <div>
                    <span>{{ $t('发送原始消息') }}</span>
                    <span>{{ $t('咻 ——') }}</span>
                </div>
                <input
                    v-model="ws_text"
                    class="ss-input"
                    style="width: 150px"
                    type="text"
                    @keyup="sendTestWs">
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'envelope']" />
                <div>
                    <span>{{ $t('应用消息测试') }}</span>
                    <span>{{ $t('#$&*#$= ……') }}</span>
                </div>
                <input
                    v-model="appmsg_text"
                    class="ss-input"
                    style="width: 150px"
                    type="text"
                    @keyup="sendTestAppmsg">
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'file-invoice']" />
                <div>
                    <span>{{ $t('输出运行时') }}</span>
                    <span>{{ $t('全都吐出来！') }}</span>
                </div>
                <button
                    style="width: 100px; font-size: 0.8rem"
                    class="ss-button"
                    @click="printRuntime">
                    {{ $t('执行') }}
                </button>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'screwdriver-wrench']" />
                <div>
                    <span>{{ $t('输出调试信息') }}</span>
                    <span>{{ $t('到底用的什么版本呢 ……') }}</span>
                </div>
                <button
                    style="width: 100px; font-size: 0.8rem"
                    class="ss-button"
                    @click="printVersionInfo">
                    {{ $t('执行') }}
                </button>
            </div>
            <template v-if="runtimeData.tags.isElectron">
                <div class="opt-item">
                    <font-awesome-icon :icon="['fas', 'power-off']" />
                    <div>
                        <span>{{ $t('重启应用') }}</span>
                        <span>{{ $t('99% 的特性都能通过重启解决！') }}</span>
                    </div>
                    <button
                        style="width: 100px; font-size: 0.8rem"
                        class="ss-button"
                        @click="restartapp">
                        {{ $t('执行') }}
                    </button>
                </div>
            </template>
        </div>
        <div class="ss-card">
            <header>{{ $t('维护与备份') }}</header>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'download']" />
                <div>
                    <span>{{ $t('导出设置项') }}</span>
                    <span>{{
                        $t('tar zcvf config.tar.gz /localStorage')
                    }}</span>
                </div>
                <button
                    style="width: 100px; font-size: 0.8rem"
                    class="ss-button"
                    @click="printSetUpInfo">
                    {{ $t('执行') }}
                </button>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'upload']" />
                <div>
                    <span>{{ $t('导入设置项') }}</span>
                    <span>{{ $t('tar zxvf cache.tar.gz /localStorage') }}</span>
                </div>
                <button
                    style="width: 100px; font-size: 0.8rem"
                    class="ss-button"
                    @click="importSetUpInfo">
                    {{ $t('执行') }}
                </button>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'trash-arrow-up']" />
                <div>
                    <span>{{ $t('重置应用') }}</span>
                    <span>{{ $t('sudo rm -rf /localStorage') }}</span>
                </div>
                <button
                    style="width: 100px; font-size: 0.8rem"
                    class="ss-button"
                    @click="resetApp">
                    {{ $t('执行') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'
    import {
        run,
        runASWEvent as save,
        saveAll,
    } from '@renderer/function/option'
    import { Connector } from '@renderer/function/connect'
    import { PopInfo, PopType } from '@renderer/function/base'
    import { runtimeData } from '@renderer/function/msg'
    import app from '@renderer/main'
    import { BrowserInfo, detect } from 'detect-browser'
    import packageInfo from '../../../../../package.json'
    import { BotMsgType } from '@renderer/function/elements/information'
    import { uptime } from '@renderer/main'
    import { loadJsonMap } from '@renderer/function/utils/appUtil'

    export default defineComponent({
        name: 'ViewOptDev',
        data() {
            return {
                jsonMapName: runtimeData.jsonMap?.name ?? '',

                BotMsgType: BotMsgType,
                runtimeData: runtimeData,
                save: save,
                run: run,
                ws_text: '',
                appmsg_text: '',
            }
        },
        mounted() {
            this.$watch(
                () => runtimeData.jsonMap?.name,
                () => {
                    this.jsonMapName = runtimeData.jsonMap?.name ?? ''
                },
            )
        },
        methods: {
            sendTestWs(event: KeyboardEvent) {
                // 发送测试 WS 消息
                if (event.keyCode === 13 && this.ws_text !== '') {
                    const info = JSON.parse(this.ws_text)
                    this.ws_text = ''
                    // 修改 echo 防止被消息处理机处理
                    info.echo = 'websocketTest'
                    Connector.sendRaw(JSON.stringify(info))
                }
            },
            sendTestAppmsg(event: KeyboardEvent) {
                if (event.keyCode === 13 && this.appmsg_text !== '') {
                    new PopInfo().add(PopType.INFO, this.appmsg_text, false)
                    this.appmsg_text = ''
                }
            },
            sendAbab() {
                new PopInfo().add(
                    PopType.INFO,
                    app.config.globalProperties.$t('你不是人（逃'),
                )
            },
            printRuntime() {
                /* eslint-disable no-console */
                console.log('=========================')
                console.log(runtimeData)
                console.log('=========================')
                /* eslint-enable no-console */
                if (runtimeData.plantform.reader) {
                    runtimeData.plantform.reader.send('win:openDevTools')
                }
            },
            async printVersionInfo() {
                new PopInfo().add(
                    PopType.INFO,
                    app.config.globalProperties.$t('正在收集调试消息……'),
                )

                // electron：索要 electron 信息
                let addInfo = undefined
                if (runtimeData.plantform.reader) {
                    addInfo =
                        await runtimeData.plantform.reader.invoke('opt:getSystemInfo')
                }

                const browser = detect() as BrowserInfo
                let info = '```\n'
                info +=
                    'Debug Info - ' +
                    new Date().toLocaleString() +
                    '\n================================\n'
                info += 'System Info:\n'
                info += `    OS Name          -> ${browser.os}\n`
                info += `    Browser Name     -> ${browser.name}\n`
                info += `    Browser Version  -> ${browser.version}\n`
                if (addInfo) {
                    const get = addInfo as { [key: string]: [string, string] }
                    Object.keys(get).forEach((name: string) => {
                        info += `    ${get[name][0]} -> ${get[name][1]}\n`
                    })
                }
                // 获取安装信息，这儿主要判断几种已提交的包管理安装方式
                if (
                    runtimeData.tags.isElectron &&
                    runtimeData.plantform.reader &&
                    runtimeData.tags.release
                ) {
                    const process = window.electron?.process
                    switch (process && process.platform) {
                        case 'linux': {
                            // archlinux
                            if (
                                runtimeData.tags.release
                                    .toLowerCase()
                                    .indexOf('arch') > 0
                            ) {
                                let pacmanInfo =
                                    await runtimeData.plantform.reader.invoke(
                                        'sys:runCommand',
                                        'pacman -Q stapxs-qq-lite-bin',
                                    )
                                if (pacmanInfo.success) {
                                    info += '    Install Type     -> aur\n'
                                } else {
                                    // 也有可能是 stapxs-qq-lite，这是我自己打的原生包
                                    pacmanInfo = await runtimeData.
                                        plantform.reader.invoke(
                                            'sys:runCommand',
                                            'pacman -Q stapxs-qq-lite',
                                        )
                                    if (pacmanInfo.success) {
                                        info +=
                                            '    Install Type     -> pacman\n'
                                    }
                                }
                            }
                            break
                        }
                    }
                }

                info += 'Application Info:\n'
                info += `    Uptime           -> ${Math.floor(((new Date().getTime() - uptime) / 1000) * 100) / 100} s\n`
                info += `    Package Version  -> ${packageInfo.version}\n`
                info += `    Service Work     -> ${runtimeData.tags.sw}\n`

                info += 'Backend Info:\n'
                info += `    Bot Info Name    -> ${runtimeData.botInfo.app_name}\n`
                info += `    Bot Info Version -> ${runtimeData.botInfo.app_version !== undefined ? runtimeData.botInfo.app_version : runtimeData.botInfo.version}\n`
                info += `    Loaded Config    -> ${runtimeData.jsonMap?.name}\n`

                info += 'View Info:\n'
                info += `    Doc Width        -> ${document.getElementById('app')?.offsetWidth} px\n`

                info += 'Network Info:\n'
                const testList = [
                    ['Github          ', 'https://api.github.com'],
                    ['Link API        ', 'https://api.stapxs.cn'],
                ]
                for (const item of testList) {
                    const start = new Date().getTime()
                    try {
                        await fetch(item[1], { method: 'GET' })
                        const end = new Date().getTime()
                        info += `    ${item[0]} -> ${end - start} ms\n`
                    } catch (e) {
                        info += `    ${item[0]} -> failed\n`
                    }
                }
                info += '```'
                // 构建 popBox 内容
                const popInfo = {
                    svg: 'screwdriver-wrench',
                    html:
                        '<textarea class="debug-info">' + info + '</textarea>',
                    title: this.$t('调试信息'),
                    button: [
                        {
                            text: app.config.globalProperties.$t('复制'),
                            fun: () => {
                                app.config.globalProperties.$copyText(info)
                                new PopInfo().add(
                                    PopType.INFO,
                                    app.config.globalProperties.$t('复制成功'),
                                )
                            },
                        },
                        {
                            text: app.config.globalProperties.$t('确定'),
                            master: true,
                            fun: () => {
                                runtimeData.popBoxList.shift()
                            },
                        },
                    ],
                }
                runtimeData.popBoxList.push(popInfo)
            },
            printSetUpInfo() {
                const json = JSON.stringify(runtimeData.sysConfig)
                const popInfo = {
                    svg: 'download',
                    html:
                        '<textarea style="width: calc(100% - 40px);min-height: 90px;background: var(--color-card-1);color: var(--color-font);border: 0;padding: 20px;border-radius: 7px;margin-top: -10px;">' +
                        json +
                        '</textarea>',
                    title: this.$t('导出设置项'),
                    button: [
                        {
                            text: app.config.globalProperties.$t('复制'),
                            fun: () => {
                                app.config.globalProperties.$copyText(json)
                                new PopInfo().add(
                                    PopType.INFO,
                                    app.config.globalProperties.$t('复制成功'),
                                )
                            },
                        },
                        {
                            text: app.config.globalProperties.$t('确定'),
                            master: true,
                            fun: () => {
                                runtimeData.popBoxList.shift()
                            },
                        },
                    ],
                }
                runtimeData.popBoxList.push(popInfo)
            },
            importSetUpInfo() {
                const popInfo = {
                    svg: 'upload',
                    html: '<textarea id="importSetUpInfoTextArea" style="width: calc(100% - 40px);min-height: 90px;background: var(--color-card-1);color: var(--color-font);border: 0;padding: 20px;border-radius: 7px;margin-top: -10px;"></textarea>',
                    title: this.$t('导入设置项'),
                    button: [
                        {
                            text: app.config.globalProperties.$t('取消'),
                            fun: () => {
                                runtimeData.popBoxList.shift()
                            },
                        },
                        {
                            text: app.config.globalProperties.$t('确定'),
                            master: true,
                            fun: () => {
                                const input = document.getElementById(
                                    'importSetUpInfoTextArea',
                                ) as HTMLTextAreaElement
                                if (input) {
                                    try {
                                        const json = JSON.parse(input.value)
                                        runtimeData.sysConfig = json
                                        saveAll(json)
                                        location.reload()
                                    } catch (e) {
                                        new PopInfo().add(
                                            PopType.ERR,
                                            app.config.globalProperties.$t(
                                                '导入设置项失败',
                                            ),
                                        )
                                    }
                                }
                            },
                        },
                    ],
                }
                runtimeData.popBoxList.push(popInfo)
            },
            resetApp() {
                const popInfo = {
                    svg: 'trash-arrow-up',
                    html:
                        '<span>' +
                        this.$t(
                            '确认要重置应用吗，重置应用将会失去所有设置内容（包括设置的置顶群组），但是可能可以解决一些因为浏览器缓存导致的奇怪问题。',
                        ) +
                        '</span>',
                    title: this.$t('重置应用'),
                    button: [
                        {
                            text: app.config.globalProperties.$t('确定'),
                            fun: () => {
                                localStorage.clear()
                                document.cookie.split(';').forEach((c) => {
                                    document.cookie = c
                                        .replace(/^ +/, '')
                                        .replace(
                                            /=.*/,
                                            '=;expires=' +
                                                new Date().toUTCString() +
                                                ';path=/',
                                        )
                                })
                                if (runtimeData.plantform.reader) {
                                    runtimeData.plantform.reader.sendSync('opt:clearAll')
                                }
                                location.reload()
                            },
                        },
                        {
                            text: app.config.globalProperties.$t('取消'),
                            master: true,
                            fun: () => {
                                runtimeData.popBoxList.shift()
                            },
                        },
                    ],
                }
                runtimeData.popBoxList.push(popInfo)
            },
            restartapp() {
                if (runtimeData.plantform.reader) {
                    runtimeData.plantform.reader.send('win:relaunch')
                }
            },
            getBotTypeName(index: BotMsgType) {
                switch (index) {
                    case BotMsgType.CQCode:
                        return this.$t('CQ 码')
                    case BotMsgType.Array:
                        return this.$t('Array 数组')
                    case BotMsgType.Auto:
                        return this.$t('自动检测')
                }
            },
            getPathMapList() {
                const pathMap = import.meta.glob('@renderer/assets/pathMap/*.yaml')
                const pathMapList: string[] = []
                Object.keys(pathMap).forEach((key: string) => {
                    const name = key.split('/').pop()?.replace('.yaml', '')
                    if (name) pathMapList.push(name)
                })
                return pathMapList
            },
            changeJsonMap() {
                const getPath = loadJsonMap(this.jsonMapName)
                if (getPath) runtimeData.jsonMap = getPath
            },
        },
    })
</script>
