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
                <div :class="checkDefault('language')" />
                <font-awesome-icon :icon="['fas', 'earth-asia']" />
                <div>
                    <span>{{ $t('语言（Language）') }}</span>
                    <span>{{ $t('喵喵喵喵？') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-model="runtimeData.sysConfig.language"
                        name="language" title="language"
                        @change="save($event);gaLanguage($event)">
                        <option v-for="item in languages" :key="item.value" :value="item.value">
                            {{ item.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div v-if="backend.isMobile()" class="ss-card">
            <header>{{ $t('图标') }}</header>
            <div class="icon-list">
                <div v-for="item in getIconList()"
                    :key="item.name"
                    :class="item.name === usedIcon ? 'selected' : ''"
                    @click="changeIcon(item.name)">
                    <img :src="item.icon">
                    <span>{{ $t(item.name != '' ? item.name : '默认') }}</span>
                </div>
            </div>
        </div>
        <div v-if=" !napcat" class="ss-card">
            <header>{{ $t('主题与颜色') }}</header>
            <template v-if="runtimeData.sysConfig.opt_auto_gtk != true">
                <div id="opt_view_dark" class="opt-item">
                    <div :class="checkDefault('opt_view_dark')" />
                    <font-awesome-icon :icon="['fas', 'moon']" />
                    <div>
                        <span>{{ $t('深色模式') }}</span>
                        <span>{{ $t('是五彩斑斓的黑色！') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input v-model="runtimeData.sysConfig.opt_dark"
                            type="checkbox" name="opt_dark" @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
                <div class="opt-item">
                    <div :class="checkDefault('opt_auto_dark')" />
                    <font-awesome-icon :icon="['fas', 'toggle-on']" />
                    <div>
                        <span>{{ $t('自动深色模式') }}</span>
                        <span>{{ $t('Biubiu ——，自动变黑！') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input v-model="runtimeData.sysConfig.opt_auto_dark"
                            type="checkbox" name="opt_auto_dark" @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
                <template v-if="runtimeData.sysConfig.opt_auto_win_color != true">
                    <div class="opt-item">
                        <div :class="checkDefault('theme_color')" />
                        <font-awesome-icon :icon="['fas', 'palette']" />
                        <div>
                            <span>{{ $t('主题色') }}</span>
                            <span>{{ $t('换个心情 🎵 ~') }}</span>
                        </div>
                        <div class="theme-color-col">
                            <input id="theme_color_custom" v-model="themeColorRaw" type="color">
                            <label class="ss-radio" style="margin-left: 10px;">
                                <input type="radio" name="theme_color"
                                    :checked="Number(runtimeData.sysConfig.theme_color) > 10"
                                    @click="themeColorChange">
                                <div style="background: linear-gradient(135deg, hsl(0 100% 50%) 0%, hsl(30 100% 60%) 16%, hsl(60 100% 60%) 33%, hsl(120 80% 45%) 50%, hsl(220 90% 45%) 66%, hsl(260 60% 40%) 83%, hsl(290 80% 50%) 100%);">
                                    <div />
                                </div>
                            </label>
                            <label v-for="(name, index) in colors" :key="'color_id_' + index"
                                :title="name" class="ss-radio">
                                <input type="radio" name="theme_color" :data-id="index"
                                    :checked="runtimeData.sysConfig.theme_color === undefined ?
                                        index === 0 : Number(runtimeData.sysConfig.theme_color) === index"
                                    @change="save($event);gaColor($event)">
                                <div
                                    :style="{ 'background': `var(--color-main-${index})` }">
                                    <div />
                                </div>
                            </label>
                        </div>
                    </div>
                </template>
            </template>
            <template v-if="backend.isDesktop() && browser.os != 'Linux'">
                <div class="opt-item">
                    <div :class="checkDefault('opt_auto_win_color')" />
                    <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" />
                    <div>
                        <span>{{ $t('自动跟随主题色') }}</span>
                        <span>{{ $t('自动获取系统的主题色设置并应用') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input v-model="runtimeData.sysConfig.opt_auto_win_color"
                            type="checkbox" name="opt_auto_win_color" @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
            </template>
            <div class="opt-item">
                <div :class="checkDefault('chat_more_blur')" />
                <font-awesome-icon :icon="['fas', 'expand']" />
                <div>
                    <span>{{ $t('透明模式') }}</span>
                    <span>{{ $t('透明超级加倍！在界面上使用更泛滥的透明和模糊') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.chat_more_blur"
                        type="checkbox" name="chat_more_blur" @change="blurTip">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="runtimeData.sysConfig.chat_more_blur && backend.platform === 'darwin' && Number(backend.release.split(' ')[1].split('.')[0]) >= 26" class="opt-item">
                <div :class="checkDefault('glass_effect')" />
                <font-awesome-icon :icon="['fas', 'wand-sparkles']" />
                <div>
                    <span>{{ $t('流体玻璃窗口') }}</span>
                    <span>{{ $t('仅支持 macOS 26 及以上系统') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.glass_effect"
                        type="checkbox" name="glass_effect" @change="glassEffectToggle">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('chat_background')" />
                <font-awesome-icon :icon="['fas', 'image']" />
                <div>
                    <span>{{ $t('背景图片') }}</span>
                    <span>{{ $t('嘿嘿嘿（痴呆') }}</span>
                </div>
                <div class="file-choice">
                    <div class="choice-btn"
                        @click="($refs.choiceImg as any)?.click()">
                        {{
                            runtimeData.sysConfig.chat_background
                                ? $t('更换背景')
                                : $t('上传背景')
                        }}
                        <input ref="choiceImg"
                            type="file"
                            style="display: none"
                            name="chat_background"
                            accept="image/*"
                            @change="setBackground($event)">
                    </div>
                    <div v-if="runtimeData.sysConfig.chat_background !== ''"
                        class="rm-btn"
                        @click="removeBackground">
                        <font-awesome-icon :icon="['fas', 'xmark']" />
                    </div>
                </div>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('chat_background_blur')" />
                <font-awesome-icon :icon="['fas', 'o']" />
                <template v-if="!runtimeData.sysConfig.chat_more_blur">
                    <div>
                        <span>{{ $t('背景模糊') }}</span>
                        <span>{{ $t('什么都看不见了（恼') }}</span>
                    </div>
                    <div class="ss-range">
                        <input v-model="runtimeData.sysConfig.chat_background_blur"
                            :style="{ 'background-size': `${runtimeData.sysConfig.chat_background_blur}% 100%` }"
                            type="range" name="chat_background_blur" @input="save">
                        <span :style="{ 'color': `var(--color-font${ runtimeData.sysConfig.chat_background_blur > 50 ? '-r' : ''})` }">
                            {{ runtimeData.sysConfig.chat_background_blur }}
                            px</span>
                    </div>
                </template>
                <template v-else>
                    <div>
                        <span>{{ $t('背景透明度') }}</span>
                        <span>{{ $t('什么都看不见了（恼') }}</span>
                    </div>
                    <div class="ss-range">
                        <input v-model="runtimeData.sysConfig.chat_background_blur"
                            :style="{ 'background-size': `${runtimeData.sysConfig.chat_background_blur}% 100%` }"
                            type="range" max="100" name="chat_background_blur"
                            @input="save">
                        <span :style="{ 'color': `var(--color-font${ runtimeData.sysConfig.chat_background_blur > 50 ? '-r' : ''})` }">
                            {{ runtimeData.sysConfig.chat_background_blur }}
                            %</span>
                    </div>
                </template>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('chat_background_align')" />
                <font-awesome-icon :icon="['fas', 'crosshairs']" />
                <div>
                    <span>{{ $t('背景对齐') }}</span>
                    <span>{{ $t('调整背景图片的对齐位置') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-model="runtimeData.sysConfig.chat_background_align"
                        name="chat_background_align" title="chat_background_align"
                        @change="save($event)">
                        <option value="center">
                            {{ $t('居中') }}
                        </option>
                        <option value="top">
                            {{ $t('顶部') }}
                        </option>
                        <option value="bottom">
                            {{ $t('底部') }}
                        </option>
                        <option value="left">
                            {{ $t('左侧') }}
                        </option>
                        <option value="right">
                            {{ $t('右侧') }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('chat_background_fit')" />
                <font-awesome-icon :icon="['fas', 'up-right-and-down-left-from-center']" />
                <div>
                    <span>{{ $t('背景填充') }}</span>
                    <span>{{ $t('调整背景图片的填充方式') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-model="runtimeData.sysConfig.chat_background_fit"
                        name="chat_background_fit" title="chat_background_fit"
                        @change="save($event)">
                        <option value="cover">
                            {{ $t('覆盖') }}
                        </option>
                        <option value="contain">
                            {{ $t('包含') }}
                        </option>
                        <option value="fill">
                            {{ $t('拉伸') }}
                        </option>
                        <option value="none">
                            {{ $t('原始大小') }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('页面') }}</header>
            <div class="opt-item">
                <div :class="checkDefault('chatview_name')" />
                <font-awesome-icon :icon="['fas', 'table-columns']" />
                <div>
                    <span>{{ $t('消息页面主题') }}</span>
                    <span>{{ $t('一些好玩的主题！') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-model="runtimeData.sysConfig.chatview_name"
                        name="chatview_name" title="chatview_name"
                        @change="save($event);gaChatView($event)">
                        <option value="">
                            {{ $t('默认') }}
                        </option>
                        <option v-for="item in getAppendChatView()"
                            :key="item" :value="item">
                            {{ item.replace('Chat', '').replace(/^['"]|['"]$/g, '').trim() }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('quick_send')" />
                <font-awesome-icon :icon="['fas', 'square-xmark']" />
                <div>
                    <span>{{ $t('默认功能按钮') }}</span>
                    <span>{{ $t('可以右击试试哦') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-model="runtimeData.sysConfig.quick_send" name="quick_send"
                        title="quick_send" @change="save">
                        <option value="default">
                            {{ $t('默认') }}
                        </option>
                        <option value="img">
                            {{ $t('图片') }}
                        </option>
                        <option value="file">
                            {{ $t('文件') }}
                        </option>
                        <option value="face">
                            {{ $t('表情') }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('opt_ind_message')" />
                <font-awesome-icon :icon="['fas', 'message']" />
                <div>
                    <span>{{ $t('独立显示消息') }}</span>
                    <span>{{ $t('始终让自己的消息显示在右边') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.opt_ind_message"
                        type="checkbox" name="opt_ind_message" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('opt_fast_animation')" />
                <font-awesome-icon :icon="['fas', 'car-side']" />
                <div>
                    <span>{{ $t('更快的动画速度') }}</span>
                    <span>{{ $t('咻咻！此选项将使动画加速到 100ms 并去除部分浪费时间的组动画') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.opt_fast_animation"
                        type="checkbox" name="opt_fast_animation" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="isMobile() && !backend.isMobile()"
                class="opt-item">
                <div :class="checkDefault('initial_scale')" />
                <font-awesome-icon :icon="['fas', 'up-down-left-right']" />
                <div>
                    <span>{{ $t('缩放比例') }}</span>
                    <span>{{ $t('调整页面在移动端的缩放比例') }}</span>
                </div>
                <div class="ss-range">
                    <input v-model="runtimeData.sysConfig.initial_scale"
                        :style="{ 'background-size': `${(initialScaleShow - 0.5) / 0.01}% 100%` }"
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.01"
                        name="initial_scale"
                        @change="scaleSave"
                        @input="setInitialScaleShow">
                    <span :style="{ 'color': `var(--color-font${initialScaleShow / 0.05 })` }">
                        {{ initialScaleShow }}</span>
                </div>
            </div>
            <div
                v-if="isMobile() && !backend.isMobile()"
                class="opt-item">
                <div :class="checkDefault('fs_adaptation')" />
                <font-awesome-icon :icon="['fas', 'border-top-left']" />
                <div>
                    <span>{{ $t('圆角适配') }}</span>
                    <span>{{ $t('适配全面屏设备防止四角出界') }}</span>
                </div>
                <div class="ss-range">
                    <input v-model="runtimeData.sysConfig.fs_adaptation"
                        :style="{ 'background-size': `${(fsAdaptationShow / 50) * 100}% 100%` }"
                        type="range"
                        min="0"
                        max="50"
                        step="10"
                        name="fs_adaptation"
                        @change="save"
                        @input="setFsAdaptationShow">
                    <span :style="{ 'color': `var(--color-font${fsAdaptationShow / 50 > 0.5 ? '-r' : ''})` }">
                        {{ fsAdaptationShow }} px
                    </span>
                </div>
            </div>
            <div v-if="backend.type == 'web' && !napcat" class="opt-item">
                <div :class="checkDefault('use_favicon_notice')" />
                <font-awesome-icon :icon="['fas', 'bell']" />
                <div>
                    <span>{{ $t('在图标上显示通知') }}</span>
                    <span>{{ $t('呜呜呜——图标都被遮挡的看不到了！') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.use_favicon_notice"
                        type="checkbox" name="use_favicon_notice" @change="save">
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
                    <input v-model="runtimeData.sysConfig.opt_revolve"
                        type="checkbox" name="opt_revolve" @change="save">
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
    import Option, { runASWEvent as save, get, checkDefault, runAS } from '../../function/option'
    import { BrowserInfo, detect } from 'detect-browser'
    import { getDeviceType } from '@renderer/function/utils/systemUtil'

    import languages from '../../assets/l10n/_l10nconfig.json'
    import { sendIdentifyData } from '@renderer/function/utils/appUtil'
    import { backend } from '@renderer/runtime/backend'

    export default defineComponent({
        name: 'ViewOptTheme',
        data() {
            return {
                napcat: import.meta.env.VITE_NAPCAT,
                backend: backend,
                get: get,
                runtimeData: runtimeData,
                checkDefault: checkDefault,
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
                usedIcon: '',
                themeColorRaw: '',
            }
        },
        mounted() {
            this.themeColorRaw = '#' + ('000000' + Number((this.runtimeData.sysConfig.theme_color || 0)).toString(16)).slice(-6)
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
            // 获取当前使用的图标
            const Onebot = (window.Capacitor as any)?.Plugins?.Onebot
            if (Onebot) {
                Onebot.addListener('onebot:icon', (data: any) => {
                    this.usedIcon = data.name.replace('AppIcon', '')
                })
                Onebot.getUsedIcon()
            }
        },
        methods: {
            gaLanguage(event: Event) {
                const sender = event.target as HTMLInputElement
                sendIdentifyData({ use_language: sender.value })
            },

            gaChatView(event: Event) {
                const sender = event.target as HTMLInputElement
                sendIdentifyData({ use_chatview: sender.value })
            },

            gaColor(event: Event) {
                const sender = event.target as HTMLInputElement
                sendIdentifyData({ use_theme_color: this.colors[Number(sender.dataset.id)] })
            },

            themeColorChange(event: Event) {
                event.preventDefault()

                const colorInput = document.getElementById(
                    'theme_color_custom',
                ) as HTMLInputElement
                if (colorInput) {
                    colorInput.click()
                    colorInput.onchange = (e) => {
                        const value = (e.target as HTMLInputElement).value
                        const saveValue = parseInt(value.replace('#', ''), 16)
                        runAS('theme_color', saveValue)
                    }
                }
            },

            blurTip(event: Event) {
                const sender = event.target as HTMLInputElement
                if (sender.checked) {
                    const popInfo = {
                        title: this.$t('提醒'),
                        html: `<span>${this.$t('开启透明模式将会对性能产生较为明显的影响，建议不要在性能较差的设备上使用此功能；此功能与"背景图片"的部分功能冲突同时会降低元素可读性。')}<br><br>
                        ${this.$t('开启后需要重启应用才能生效，确定要开启吗？')}</span>`,
                        button: [
                            {
                                text: this.$t('确认'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    save(event)
                                    sendIdentifyData({ use_transparent: true })
                                    setTimeout(() => {
                                        this.restartapp()
                                    }, 500)
                                },
                            },
                            {
                                text: this.$t('取消'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    sender.checked = false
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                } else {
                    const popInfo = {
                        title: this.$t('提醒'),
                        html: `<span>${this.$t('关闭透明模式需要重启应用才能生效。')}<br><br>
                        ${this.$t('确定要重启吗？')}</span>`,
                        button: [
                            {
                                text: this.$t('确认'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    save(event)
                                    sendIdentifyData({ use_transparent: false })
                                    setTimeout(() => {
                                        this.restartapp()
                                    }, 500)
                                },
                            },
                            {
                                text: this.$t('取消'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    sender.checked = true
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
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
                        html: '<span>' + this.$t('缩放比例调整已取消，已恢复默认缩放比例。') + '</span>',
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
                    html: '<span>' + this.$t('点击确认以应用缩放比例，预览将在 5 秒后取消……') + '</span>',
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
                backend.call(undefined, 'win:relaunch', false)
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
                    let name = key.split('/').pop()?.split('.')[0]
                    name = name ? name.toString().replaceAll(/(^['"]|['"]$)/g, '').trim() : name
                    if (name && name.startsWith('Chat')) {
                        chatViewList.push(name)
                    }
                })
                return chatViewList
            },

            getIconList() {
                const iconList = import.meta.glob('@renderer/assets/img/icons/*.png', { eager: true })
                const iconListInfo = [] as { name: string, icon: any }[]
                Object.keys(iconList).forEach((key: string) => {
                    const name = key.split('/').pop()?.split('.')[0]
                    const iconName = name?.replace('AppIcon', '')
                    if( name && name.indexOf('AppIcon') >= 0 && iconName != undefined) {
                        if(!runtimeData.tags.darkMode && !iconName.endsWith('Dark')) {
                            iconListInfo.push({ name: iconName, icon: (iconList[key] as any).default })
                        } else if(runtimeData.tags.darkMode && iconName.endsWith('Dark')) {
                            iconListInfo.push({ name: iconName.replace('Dark', ''), icon: (iconList[key] as any).default })
                        }
                    }
                })
                return iconListInfo
            },

            changeIcon(name: string) {
                backend.call('Onebot', 'changeIcon', false, { name: name != '' ? (name + 'AppIcon') : name })
                this.usedIcon = name
            },


            /**
             * 设置背景图片
             */
            setBackground(event: Event) {
                const sender = event.target as HTMLInputElement
                const img = sender.files?.[0]
                if (!img) return
                img.arrayBuffer().then((buffer) => {
                    // 使用更可靠的方式将二进制数据转换为 base64
                    const bytes = new Uint8Array(buffer)
                    let binary = ''
                    const chunkSize = 0x8000 // 32KB chunks to avoid call stack size exceeded
                    for (let i = 0; i < bytes.length; i += chunkSize) {
                        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
                        // 使用 fromCodePoint 为每个字节生成字符并拼接，避免使用 apply 导致的参数长度问题
                        binary += Array.from(chunk, (b) => String.fromCodePoint(b)).join('')
                    }
                    const base64String = btoa(binary)
                    const imgSrc = `data:${img.type};base64,${base64String}`
                    runtimeData.sysConfig.chat_background = imgSrc
                    Option.runAS('chat_background', imgSrc)
                })
            },
            /**
             * 移除背景图片
             */
            removeBackground() {
                runtimeData.sysConfig.chat_background = ''
                Option.runAS('chat_background', '')
            },

            /**
             * 切换 Glass Effect
             */
            glassEffectToggle(event: Event) {
                const sender = event.target as HTMLInputElement

                if (sender.checked) {
                    const popInfo = {
                        title: this.$t('提醒'),
                        html: `<span>${this.$t('开启原生玻璃效果需要重启应用才能生效。')}<br><br>
                        ${this.$t('确定要重启吗？')}</span>`,
                        button: [
                            {
                                text: this.$t('确认'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    save(event)
                                    setTimeout(() => {
                                        this.restartapp()
                                    }, 500)
                                },
                            },
                            {
                                text: this.$t('取消'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    sender.checked = false
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                } else {
                    const popInfo = {
                        title: this.$t('提醒'),
                        html: `<span>${this.$t('关闭流体玻璃效果需要重启应用才能生效')}<br><br>
                        ${this.$t('确定要重启吗？')}</span>`,
                        button: [
                            {
                                text: this.$t('确认'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    save(event)
                                    setTimeout(() => {
                                        this.restartapp()
                                    }, 500)
                                },
                            },
                            {
                                text: this.$t('取消'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                    sender.checked = true
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
            },
        },
    })
</script>
