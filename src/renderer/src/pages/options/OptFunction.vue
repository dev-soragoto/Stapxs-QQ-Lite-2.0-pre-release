<!--
 * @FileDescription: 设置页面（功能子页面）
 * @Author: Stapxs
 * @Date: 2022/11/07
 * @Version: 1.0
-->
<!-- eslint-disable max-len -->

<template>
    <div class="opt-page">
        <div class="ss-card">
            <header>{{ $t('通知选项') }}</header>
            <div class="opt-item">
                <div :class="checkDefault('close_notice')" />
                <font-awesome-icon :icon="['fas', 'volume-xmark']" />
                <div>
                    <span>{{ $t('禁用通知') }}</span>
                    <span>{{ $t('好嘛 …… 不烦你 ……') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.close_notice"
                        type="checkbox" name="close_notice" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('bubble_sort_user')" />
                <font-awesome-icon :icon="['fas', 'box-open']" />
                <div>
                    <span>{{ $t('群收纳盒') }}</span>
                    <span>{{ $t('全都放出来！全都放出来！') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.bubble_sort_user"
                        type="checkbox" name="bubble_sort_user" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="!runtimeData.sysConfig.bubble_sort_user" class="opt-item">
                <div :class="checkDefault('group_notice_type')" />
                <font-awesome-icon :icon="['fas', 'user-group']" />
                <div>
                    <span>{{ $t('群消息通知方式') }}</span>
                    <span>{{ $t('重要消息将始终发起应用内通知和系统通知') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-model="runtimeData.sysConfig.group_notice_type"
                        name="group_notice_type" title="group_notice_type" @change="save">
                        <option value="none">
                            {{ $t('不通知（默认）') }}
                        </option>
                        <option value="inner">
                            {{ $t('仅应用内通知') }}
                        </option>
                        <option value="all">
                            {{ $t('应用内通知和系统通知') }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('聊天选项') }}</header>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'box-archive']" />
                <div>
                    <span>{{ $t('消息防撤回') }}</span>
                    <span>{{
                        ndt === 0 ? $t('说出去的话就像泼出去的水 ……') : $t('说了不做这功能就是不做')
                    }}</span>
                </div>
                <label
                    v-if="ndt < 3"
                    class="ss-switch">
                    <input v-model="ndv" type="checkbox" @change="msgND">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('msg_taill')" />
                <font-awesome-icon :icon="['fas', 'fish-fins']" />
                <div>
                    <span>{{ $t('小尾巴') }}</span>
                    <span>{{ $t('只会追加在最后一段话后面') }}</span>
                </div>
                <input v-model="runtimeData.sysConfig.msg_taill"
                    class="ss-input" style="width: 150px"
                    type="text" name="msg_taill" @keyup="save">
            </div>
            <div class="opt-item">
                <div :class="checkDefault('send_face')" />
                <font-awesome-icon :icon="['fas', 'square-arrow-up-right']" />
                <div>
                    <span>{{ $t('直接发送表情') }}</span>
                    <span>{{
                        $t('咻！点击发送！')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.send_face"
                        type="checkbox" name="send_face" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('use_breakline')" />
                <font-awesome-icon :icon="['fas', 'keyboard']" />
                <div>
                    <span>{{ $t('多行模式') }}</span>
                    <span>{{ $t('I have a shift I have an enter ...') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.use_breakline" type="checkbox"
                        name="use_breakline" @change="breakLineTip($event);save($event)">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="runtimeData.sysConfig.use_breakline" class="opt-item">
                <div :class="checkDefault('send_key')" />
                <font-awesome-icon :icon="['fas', 'keyboard']" />
                <div>
                    <span>{{ $t('发送键') }}</span>
                    <span>{{ $t('你可以使用其他组合键来换行') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-if="backend.platform === 'darwin' || backend.platform === 'ios'" v-model="runtimeData.sysConfig.send_key"
                        name="send_key" title="send_key" @change="save">
                        <option value="none">
                            Enter
                        </option>
                        <option value="shift">
                            Shift + Enter (⇧)
                        </option>
                        <option value="ctrl">
                            Control + Enter (⌃)
                        </option>
                        <option value="alt">
                            Option + Enter (⌥)
                        </option>
                        <option value="meta">
                            Command + Enter (⌘)
                        </option>
                    </select>
                    <select v-else v-model="runtimeData.sysConfig.send_key"
                        name="send_key" title="send_key" @change="save">
                        <option value="none">
                            Enter
                        </option>
                        <option value="shift">
                            Shift + Enter
                        </option>
                        <option value="ctrl">
                            Ctrl + Enter
                        </option>
                        <option value="alt">
                            Alt + Enter
                        </option>
                        <option value="meta">
                            Meta + Enter
                        </option>
                    </select>
                </div>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('record_recent_emoji')" />
                <font-awesome-icon :icon="['fas', 'clock-rotate-left']" />
                <div>
                    <span>{{ $t('缓存最近使用表情') }}</span>
                    <span>{{ $t('终于不用翻表情了') }}</span>
                </div>
                <div class="select-wrapper">
                    <select
                        v-model="runtimeData.sysConfig.record_recent_emoji"
                        name="record_recent_emoji"
                        title="record_recent_emoji">
                        <option value="none">
                            {{ $t('不记录') }}
                        </option>
                        <option value="order">
                            {{ $t('使用顺序') }}
                        </option>
                        <option value="100times">
                            {{ $t('100次使用频率（默认）') }}
                        </option>
                        <option value="500times">
                            {{ $t('500次使用频率') }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('浏览选项') }}</header>
            <div class="opt-item">
                <div :class="checkDefault('close_respond')" />
                <font-awesome-icon :icon="['fas', 'comments']" />
                <div>
                    <span>{{ $t('关闭回应功能') }}</span>
                    <span>{{
                        $t('如果你不想用它或者 bot 不支持，可以关闭这个功能')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.close_respond"
                        type="checkbox" name="close_respond" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('use_super_face')" />
                <font-awesome-icon :icon="['fas', 'face-laugh-squint']" />
                <div>
                    <span>{{ $t('超级表情') }}</span>
                    <span>{{
                        $t('小黄脸长大了，变成了大黄脸！')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.use_super_face"
                        type="checkbox" name="use_super_face" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>

            <div v-if="backend.isDesktop()"
                class="opt-item">
                <div :class="checkDefault('opt_always_top')" />
                <font-awesome-icon :icon="['fas', 'angle-up']" />
                <div>
                    <span>{{ $t('置顶窗口') }}</span>
                    <span>{{
                        $t('你也不想想让 ta 知道你不在看消息吧 ~')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.opt_always_top"
                        type="checkbox" name="opt_always_top" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('close_browser')" />
                <font-awesome-icon :icon="['fas', 'globe']" />
                <div>
                    <span>{{ $t('禁用内置浏览器') }}</span>
                    <span>{{ $t('让我看看你的浏览器 👀') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.close_browser"
                        type="checkbox" name="close_browser" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
        <div v-if="backend.type === 'tauri'" class="ss-card">
            <header>{{ $t('消息存储') }}</header>
            <div class="tip">
                {{
                    $t('Stapxs QQ Lite 支持将消息缓存至本地，消息将以加密数据库的方式安全的保存。')
                }}
            </div>
            <div v-if="dbStats != null" class="db-stats-bar">
                <font-awesome-icon :icon="['fas', 'circle-info']" />
                <span>{{ $t('已保存 {count} 条消息', { count: dbStats.totalMessages.toLocaleString() }) }} · {{ formatDbSize(dbStats.dbSizeBytes) }}</span>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('enable_local_history')" />
                <font-awesome-icon :icon="['fas', 'database']" />
                <div>
                    <span>{{ $t('启用消息存储') }}</span>
                    <span>{{ $t('保存消息记录何尝不是一种囤囤鼠') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.enable_local_history"
                        type="checkbox" name="enable_local_history" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="runtimeData.sysConfig.enable_local_history" class="opt-item">
                <div :class="checkDefault('local_history_first')" />
                <font-awesome-icon :icon="['fas', 'bolt']" />
                <div>
                    <span>{{ $t('优先加载本地历史') }}</span>
                    <span>{{ $t('不会吧不会吧，存了真的不用吗.png') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.local_history_first"
                        type="checkbox" name="local_history_first"
                        :disabled="!runtimeData.sysConfig.enable_local_history"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('分析信息') }}</header>
            <div
                class="opt-item"
                :style="runtimeData.sysConfig.close_ga !== true ?
                    'background: var(--color-card-1);' : ''">
                <div :class="checkDefault('close_ga')" />
                <font-awesome-icon :icon="['fas', 'cloud']" />
                <div>
                    <span>{{ $t('关闭分析') }}</span>
                    <span>{{ $t('真的不让看吗（小声') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.close_ga" type="checkbox"
                        name="close_ga" @change="save">
                    <div style="background: var(--color-card-2)">
                        <div />
                    </div>
                </label>
            </div>
            <div
                v-if="runtimeData.sysConfig.close_ga !== true"
                class="tip">
                {{
                    $t('我们使用 Umami 对应用的使用情况进行分析，它将不会上传精确到用户的信息；你也可以在这儿控制分析功能的开关和额外分析项。')
                }}
            </div>
            <div v-if="runtimeData.sysConfig.close_ga !== true" class="opt-item">
                <font-awesome-icon :icon="['fas', 'file-invoice']" />
                <div>
                    <span>{{ $t('分析统计信息') }}</span>
                    <span>{{ $t('都有些什么数据呢') }}</span>
                </div>
                <button style="width: 100px; font-size: 0.8rem"
                    class="ss-button" @click=" showUmamiInfo">
                    {{ $t('查看') }}
                </button>
            </div>
            <div v-if="runtimeData.sysConfig.close_ga !== true"
                class="opt-item">
                <div :class="checkDefault('open_ga_bot')" />
                <font-awesome-icon :icon="['fas', 'dice']" />
                <div>
                    <span>{{ $t('后端类型分析') }}</span>
                    <span>{{ $t('在连接后上传所使用的 bot 的类型分析') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="runtimeData.sysConfig.open_ga_bot" type="checkbox"
                        name="open_ga_bot" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, markRaw } from 'vue'
    import { runASWEvent as save, checkDefault } from '@renderer/function/option'
    import { runtimeData } from '@renderer/function/msg'

    import UmamiInfoPan from '@renderer/components/UmamiInfoPan.vue'
import { backend } from '@renderer/runtime/backend'
import { dbGetStats } from '@renderer/function/utils/localHistoryUtil'

    export default defineComponent({
        name: 'ViewOptFunction',
        data() {
            return {
                backend,
                checkDefault: checkDefault,
                runtimeData: runtimeData,
                dbStats: null as { totalMessages: number; dbSizeBytes: number } | null,
                save: save,
                ndt: 0,
                ndv: false,
            }
        },
        watch: {
            'runtimeData.loginInfo.uin': {
                immediate: true,
                handler(uin: string | number) {
                    if (uin && runtimeData.sysConfig.enable_local_history) {
                        this.loadDbStats()
                    }
                },
            },
        },
        methods: {
            async loadDbStats() {
                if (runtimeData.loginInfo?.uin) {
                    this.dbStats = await dbGetStats(runtimeData.loginInfo.uin)
                }
            },
            formatDbSize(bytes: number): string {
                if (bytes < 1024) return `${bytes} B`
                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
                return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
            },
            showUmamiInfo() {
                const popInfo = {
                    title: '',
                    template: markRaw(UmamiInfoPan),
                    full: true,
                    allowQuickClose: false
                }
                runtimeData.popBoxList.push(popInfo)
            },

            msgND: function () {
                this.ndt++
                setTimeout(() => {
                    this.ndv = false
                }, 300)
            },
            breakLineTip(event: Event) {
                const sender = event.target as HTMLInputElement
                if (sender.checked) {
                    const popInfo = {
                        title: this.$t('提醒'),
                        html: `<span>${this.$t('开启多行模式可能会在一些拥有特殊选词模式的输入法上出现问题，如 微软注音2003、新注音2003 和 绝大部分很早期的拼音输入法；如果在使用的时候遇到问题可以尝试关闭此功能。（或者换个更现代的输入法）')}</span>`,
                        button: [
                            {
                                text: this.$t('知道了'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
            }
        },
    })
</script>
<style>
    .ss-switch input:checked ~ div {
        background: var(--color-main) !important;
    }

    .ga-share {
        background: var(--color-card-2);
        border-radius: 7px;
        align-items: center;
        margin-top: 10px;
        cursor: pointer;
        display: flex;
        padding: 10px 20px;
    }

    .ga-share > svg {
        fill: var(--color-font);
        margin-right: 10px;
        width: 20px;
    }

    .ga-share > a {
        text-decoration: underline;
        color: var(--color-font-1);
        font-size: 0.8rem;
    }

    .db-stats-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 4px 0 2px;
        padding: 10px 20px;
        background: var(--color-card-2);
        border-radius: 5px;
        font-size: 0.78rem;
        color: var(--color-font-1);
    }

    .db-stats-bar > svg {
        width: 12px;
        flex-shrink: 0;
        opacity: 0.7;
    }
</style>
