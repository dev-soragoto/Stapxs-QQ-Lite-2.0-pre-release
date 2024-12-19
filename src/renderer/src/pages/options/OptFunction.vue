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
                <font-awesome-icon :icon="['fas', 'volume-xmark']" />
                <div>
                    <span>{{ $t('禁用通知') }}</span>
                    <span>{{ $t('好嘛 …… 不烦你 ……') }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.close_notice"
                        type="checkbox"
                        name="close_notice"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div
                v-if="!runtimeData.sysConfig.close_notice"
                class="opt-item">
                <font-awesome-icon :icon="['fas', 'bolt']" />
                <div>
                    <span>{{ $t('通知所有新消息') }}</span>
                    <span>{{ $t('让暴风雨来得更猛烈些吧！') }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.notice_all"
                        type="checkbox"
                        name="notice_all"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('聊天选项') }}</header>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'box-archive']" />
                <div>
                    <span>{{ $t('消息防撤回') }}</span>
                    <span>{{
                        ndt === 0 ?
                            $t('说出去的话就像泼出去的水 ……')
                            : $t('说了不做这功能就是不做')
                    }}</span>
                </div>
                <label
                    v-if="ndt < 3"
                    class="ss-switch">
                    <input
                        v-model="ndv"
                        type="checkbox"
                        @change="msgND">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'window-maximize']" />
                <div>
                    <span>{{ $t('禁用图片发送框') }}</span>
                    <span>{{ $t('你也向往自由吗？') }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.close_chat_pic_pan"
                        type="checkbox"
                        name="close_chat_pic_pan"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'face-laugh-squint']" />
                <div>
                    <span>{{ $t('关闭回应功能') }}</span>
                    <span>{{
                        $t('如果你不想用它或者 bot 不支持，可以关闭这个功能')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.close_respond"
                        type="checkbox"
                        name="close_respond"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'fish-fins']" />
                <div>
                    <span>{{ $t('小尾巴') }}</span>
                    <span>{{ $t('只会追加在最后一段话后面') }}</span>
                </div>
                <input
                    v-model="runtimeData.sysConfig.msg_taill"
                    class="ss-input"
                    style="width: 150px"
                    type="text"
                    name="msg_taill"
                    @keyup="save">
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'keyboard']" />
                <div>
                    <span>{{ $t('使用 shift enter 换行') }}</span>
                    <span>{{ $t('I have a shift I have an enter ...') }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.use_breakline"
                        type="checkbox"
                        name="use_breakline"
                        @change="breakLineTip($event);save($event)
                        ">
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
                :style="
                    runtimeData.sysConfig.close_ga !== true ?
                        'background: var(--color-card-1);'
                        : ''
                ">
                <font-awesome-icon :icon="['fas', 'cloud']" />
                <div>
                    <span>{{ $t('关闭分析') }}</span>
                    <span>{{ $t('真的不让看吗（小声') }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.close_ga"
                        type="checkbox"
                        name="close_ga"
                        @change="save">
                    <div style="background: var(--color-card-2)">
                        <div />
                    </div>
                </label>
            </div>
            <div
                v-if="runtimeData.sysConfig.close_ga !== true"
                class="tip">
                {{
                    $t(
                        '我们使用 Umami 对应用的使用情况进行分析，它将不会上传精确到用户的信息；你也可以在这儿控制分析功能的开关和额外分析项。同时我们的统计信息公开展示在此处以便查阅：'
                    )
                }}
                <div class="ga-share">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 428 389.11">
                        <circle
                            cx="214.15"
                            cy="181"
                            r="171"
                            fill="none"
                            stroke="currentColor"
                            stroke-miterlimit="10"
                            stroke-width="20" />
                        <path
                            d="M413 134.11H15.29a15 15 0 0 0-15 15v15.3C.12 168 0 171.52 0 175.11c0 118.19 95.81 214 214 214 116.4 0 211.1-92.94 213.93-208.67 0-.44.07-.88.07-1.33v-30a15 15 0 0 0-15-15Z" />
                    </svg>
                    <a
                        target="_blank"
                        @click="showStatus">{{ $t('Stapxs QQ Lite') }} {{ $t('访问统计信息') }}</a>
                </div>
            </div>
            <div
                v-if="runtimeData.sysConfig.close_ga !== true"
                class="opt-item">
                <font-awesome-icon :icon="['fas', 'dice']" />
                <div>
                    <span>{{ $t('后端类型分析') }}</span>
                    <span>{{ $t('在连接后上传所使用的 bot 的类型分析') }}</span>
                </div>
                <label class="ss-switch">
                    <input
                        v-model="runtimeData.sysConfig.open_ga_bot"
                        type="checkbox"
                        name="open_ga_bot"
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
    import { defineComponent } from 'vue'
    import { runASWEvent as save } from '@renderer/function/option'
    import { runtimeData } from '@renderer/function/msg'
    import { openLink } from '@renderer/function/utils/appUtil'

    export default defineComponent({
        name: 'ViewOptFunction',
        data() {
            return {
                runtimeData: runtimeData,
                save: save,
                ndt: 0,
                ndv: false,
            }
        },
        methods: {
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
                        html: `<span>${this.$t('开启 shift enter 换行可能会在一些拥有特殊选词模式的输入法上出现问题，如 微软注音2003、新注音2003 和 绝大部分很早期的拼音输入法；如果在使用的时候遇到问题可以尝试关闭此功能。（或者换个更现代的输入法）')}</span>`,
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
            },
            showStatus() {
                if (import.meta.env.VITE_APP_MU_SHARE) {
                    openLink(import.meta.env.VITE_APP_MU_SHARE, true)
                }
            },
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
</style>
