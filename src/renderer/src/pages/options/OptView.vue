<!--
 * @FileDescription: 设置页面（界面子页面）
 * @Author: Stapxs
 * @Date: 2022/09/26
 * @Version: 1.0
-->

<template>
    <div class="opt-page">
        <div class="ss-card">
            <header>{{ $t('本土化') }}</header>
            <div class="l10n-info">
                <font-awesome-icon :icon="['fas', 'language']" />
                <div>
                    <span>{{ $t('简体中文') }}</span>
                    <span class="author">{{ $t('作者：') }}{{ $t('Stapx Steve') }}</span>
                    <span>{{
                        $t('你好世界！这是 Stapxs QQ Lite 的默认简体中文。')
                    }}</span>
                </div>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'earth-asia']" />
                <div>
                    <span>{{ $t('语言（Language）') }}</span>
                    <span>{{ $t('喵喵喵喵？') }}</span>
                </div>
                <select
                    v-model="runtimeData.sysConfig.language"
                    name="language"
                    title="language"
                    @change="
                        save($event);
                        gaLanguage($event)
                    ">
                    <option
                        v-for="item in languages"
                        :key="item.value"
                        :value="item.value">
                        {{ item.name }}
                    </option>
                </select>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('主题与颜色') }}</header>
            <template v-if="runtimeData.sysConfig.opt_auto_gtk != true">
                <div
                    id="opt_view_dark"
                    class="opt-item">
                    <font-awesome-icon :icon="['fas', 'moon']" />
                    <div>
                        <span>{{ $t('深色模式') }}</span>
                        <span>{{ $t('是五彩斑斓的黑色！') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input
                            v-model="runtimeData.sysConfig.opt_dark"
                            type="checkbox"
                            name="opt_dark"
                            @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
                <div class="opt-item">
                    <font-awesome-icon :icon="['fas', 'toggle-on']" />
                    <div>
                        <span>{{ $t('自动深色模式') }}</span>
                        <span>{{ $t('Biubiu ——，自动变黑！') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input
                            v-model="runtimeData.sysConfig.opt_auto_dark"
                            type="checkbox"
                            name="opt_auto_dark"
                            @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
                <template
                    v-if="runtimeData.sysConfig.opt_auto_win_color != true">
                    <div class="opt-item">
                        <font-awesome-icon :icon="['fas', 'palette']" />
                        <div>
                            <span>{{ $t('主题色') }}</span>
                            <span>{{ $t('换个心情 🎵 ~') }}</span>
                        </div>
                        <div class="theme-color-col">
                            <label
                                v-for="(name, index) in colors"
                                :key="'color_id_' + index"
                                :title="name"
                                class="ss-radio">
                                <input
                                    type="radio"
                                    name="theme_color"
                                    :data-id="index"
                                    :checked="
                                        runtimeData.sysConfig.theme_color ===
                                            undefined
                                            ? index === 0
                                            : Number(
                                                runtimeData.sysConfig
                                                    .theme_color,
                                            ) === index
                                    "
                                    @change="save($event);gaColor($event)">
                                <div
                                    :style="
                                        'background: var(--color-main-' +
                                            index +
                                            ');'
                                    ">
                                    <div />
                                </div>
                            </label>
                        </div>
                    </div>
                </template>
            </template>
            <template
                v-if="runtimeData.tags.isElectron && browser.os == 'Linux'">
                <div class="opt-item">
                    <font-awesome-icon :icon="['fas', 'window-restore']" />
                    <div>
                        <span>{{ $t('自动跟随 GTK 主题') }}</span>
                        <span>{{
                            $t('（实验性）自动从 GTK 配置获取主题配色')
                        }}</span>
                    </div>
                    <label class="ss-switch">
                        <input
                            v-model="runtimeData.sysConfig.opt_auto_gtk"
                            type="checkbox"
                            name="opt_auto_gtk"
                            @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
            </template>
            <template
                v-if="runtimeData.tags.isElectron && browser.os != 'Linux'">
                <div class="opt-item">
                    <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" />
                    <div>
                        <span>{{ $t('自动跟随主题色') }}</span>
                        <span>{{ $t('自动获取的主题色设置并应用') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input
                            v-model="runtimeData.sysConfig.opt_auto_win_color"
                            type="checkbox"
                            name="opt_auto_win_color"
                            @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
            </template>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'table-columns']" />
                <div>
                    <span>{{ $t('消息页面主题') }}</span>
                    <span>{{ $t('一些好玩的主题！') }}</span>
                </div>
                <select
                    v-model="chatview_name"
                    name="chatview_name"
                    title="chatview_name"
                    @change="save($event);gaChatView($event)">
                    <option value="">
                        {{ $t('默认') }}
                    </option>
                    <option
                        v-for="item in getAppendChatView()"
                        :key="item"
                        :value="item">
                        {{ item.replace('Chat', '') }}
                    </option>
                </select>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'image']" />
                <div>
                    <span>{{ $t('背景图片') }}</span>
                    <span>{{ $t('嘿嘿嘿（痴呆') }}</span>
                </div>
                <input
                    v-model="runtimeData.sysConfig.chat_background"
                    class="ss-input"
                    style="width: 150px"
                    type="text"
                    name="chat_background"
                    @keyup="save">
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'o']" />
                <div>
                    <span>{{ $t('背景模糊') }}</span>
                    <span>{{ $t('什么都看不见了（恼') }}</span>
                </div>
                <div class="ss-range">
                    <input
                        v-model="runtimeData.sysConfig.chat_background_blur"
                        :style="`background-size:
                ${runtimeData.sysConfig.chat_background_blur}% 100%;`"
                        type="range"
                        name="chat_background_blur"
                        @input="save">
                    <span
                        :style="`color: var(--color-font${
                            runtimeData.sysConfig.chat_background_blur > 50 ? '-r' : ''})`">
                        {{ runtimeData.sysConfig.chat_background_blur }}
                        px</span>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('页面') }}</header>
            <div
                v-if="isMobile() && !runtimeData.tags.isCapacitor"
                class="opt-item">
                <font-awesome-icon :icon="['fas', 'up-down-left-right']" />
                <div>
                    <span>{{ $t('缩放比例') }}</span>
                    <span>{{ $t('调整页面在移动端的缩放比例') }}</span>
                </div>
                <div class="ss-range">
                    <input
                        v-model="runtimeData.sysConfig.initial_scale"
                        :style="`background-size: ${(initialScaleShow - 0.5) / 0.01}% 100%`"
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.01"
                        name="initial_scale"
                        @change="scaleSave"
                        @input="setInitialScaleShow">
                    <span
                        :style="`color: var(--color-font${
                            initialScaleShow / 0.05 })`">
                        {{ initialScaleShow }}</span>
                </div>
            </div>
            <div
                v-if="isMobile() && !runtimeData.tags.isCapacitor"
                class="opt-item">
                <font-awesome-icon :icon="['fas', 'border-top-left']" />
                <div>
                    <span>{{ $t('圆角适配') }}</span>
                    <span>{{ $t('适配全面屏设备防止四角出界') }}</span>
                </div>
                <div class="ss-range">
                    <input
                        v-model="runtimeData.sysConfig.fs_adaptation"
                        :style="`background-size: ${(fsAdaptationShow / 50) * 100}% 100%;`"
                        type="range"
                        min="0"
                        max="50"
                        step="10"
                        name="fs_adaptation"
                        @change="save"
                        @input="setFsAdaptationShow">
                    <span
                        :style="`color: var(--color-font${
                            fsAdaptationShow / 50 > 0.5 ? '-r' : ''})`">
                        {{ fsAdaptationShow }} px
                    </span>
                </div>
            </div>
            <div
                v-if="runtimeData.tags.isElectron"
                class="opt-item">
                <font-awesome-icon :icon="['fas', 'angle-up']" />
                <div>
                    <span>{{ $t('置顶窗口') }}</span>
                    <span>{{
                        $t('你也不想想让 ta 知道你不在看消息吧 ~')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.opt_always_top"
                        type="checkbox"
                        name="opt_always_top"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
                <div>
                    <span>{{ $t('不要点这个') }}</span>
                    <span>{{ $t('啊吧啊吧（智慧）') }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.opt_revolve"
                        type="checkbox"
                        name="opt_revolve"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, toRaw } from 'vue'
    import { runtimeData } from '../../function/msg'
    import { runASWEvent as save, get } from '../../function/option'
    import { BrowserInfo, detect } from 'detect-browser'
    import { getDeviceType } from '@renderer/function/utils/systemUtil'

    import languages from '../../assets/l10n/_l10nconfig.json'
    import { sendStatEvent } from '@renderer/function/utils/appUtil'

    export default defineComponent({
        name: 'ViewOptTheme',
        data() {
            return {
                get: get,
                runtimeData: runtimeData,
                save: save,
                languages: languages,
                // 别问我为什么微软是紫色的
                colors: [
                    '林槐蓝',
                    '墨竹青',
                    '少女粉',
                    '微软紫',
                    '坏猫黄',
                    '玄素黑',
                ],
                browser: detect() as BrowserInfo,
                initialScaleShow: 0.5,
                fsAdaptationShow: 0,
                chatview_name: '',
            }
        },
        mounted() {
            // 一次性初始化一次缩放级别
            const watch = this.$watch(
                () => runtimeData.sysConfig,
                () => {
                    this.initialScaleShow = toRaw(
                        runtimeData.sysConfig.initial_scale,
                    )
                    this.fsAdaptationShow = toRaw(
                        runtimeData.sysConfig.fs_adaptation,
                    )
                    watch()
                },
            )
            this.$watch(
                () => runtimeData.sysConfig.chatview_name,
                () => {
                    this.chatview_name = runtimeData.sysConfig.chatview_name
                },
            )
        },
        methods: {
            gaLanguage(event: Event) {
                const sender = event.target as HTMLInputElement
                sendStatEvent('use_language', { name: sender.value })
            },

            gaChatView(event: Event) {
                const sender = event.target as HTMLInputElement
                sendStatEvent('use_chatview', { name: sender.value })
            },

            gaColor(event: Event) {
                const sender = event.target as HTMLInputElement
                sendStatEvent('use_theme_color', {
                    name: this.colors[Number(sender.dataset.id)],
                })
            },

            scaleSave(event: Event) {
                save(event)
                // 5 秒后自动取消防止误操作导致无法恢复
                const timerId = setTimeout(() => {
                    (event.target as HTMLInputElement).value = '0.85'
                    runtimeData.sysConfig.initial_scale = 0.85
                    this.initialScaleShow = 0.85
                    save(event)
                    runtimeData.popBoxList.pop()
                    const popInfo = {
                        svg: 'up-down-left-right',
                        html:
                            '<span>' +
                            this.$t(
                                '缩放比例调整已取消，已恢复默认缩放比例。',
                            ) +
                            '</span>',
                        title: this.$t('确认缩放比例'),
                        button: [
                            {
                                text: this.$t('取消'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.pop()
                                },
                            }
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }, 5000)
                // 保存提醒
                const popInfo = {
                    svg: 'up-down-left-right',
                    html:
                        '<span>' +
                        this.$t(
                            '点击确认以应用缩放比例，预览将在 5 秒后取消……',
                        ) +
                        '</span>',
                    title: this.$t('确认缩放比例'),
                    button: [
                        {
                            text: this.$t('确定'),
                            fun: () => {
                                runtimeData.popBoxList.pop()
                                clearTimeout(timerId)
                            },
                        }
                    ],
                }
                runtimeData.popBoxList.push(popInfo)
            },

            setInitialScaleShow(event: Event) {
                const sender = event.target as HTMLInputElement
                this.initialScaleShow = Number(sender.value)
            },
            setFsAdaptationShow(event: Event) {
                const sender = event.target as HTMLInputElement
                this.fsAdaptationShow = Number(sender.value)
            },

            restartapp() {
                if (runtimeData.plantform.reader) {
                    runtimeData.plantform.reader.send('win:relaunch')
                }
            },

            isMobile() {
                return (
                    getDeviceType() === 'Android' || getDeviceType() === 'iOS'
                )
            },

            getAppendChatView() {
                const chatView = import.meta.glob('@renderer/pages/chat-view/*.vue', { eager: true })
                const chatViewList: string[] = []
                Object.keys(chatView).forEach((key: string) => {
                    const name = key.split('/').pop()?.split('.')[0]
                    if (name && name.startsWith('Chat')) {
                        chatViewList.push(name)
                    }
                })
                return chatViewList
            },
        },
    })
</script>
