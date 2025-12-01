<template>
    <div class="chat-test">
        <chat v-bind="$props">
            <template #main-input-button>
                <div style="cursor: pointer" @click="onRobotClick" @contextmenu.prevent="openAPIConfig">
                    <font-awesome-icon :icon="['fas', 'robot']" />
                </div>
            </template>
            <template #chat-extra>
                <div v-if="onLoading || dataList.length > 0" id="chat-extra" class="chat-extra">
                    <div v-if="dataList.length == 0" class="ss-card load">
                        <font-awesome-icon :icon="['fas', 'spinner']" spin />
                    </div>
                    <div v-else class="options">
                        <div v-for="(item, index) in dataList" :key="index"
                            @click="selectChoice(item)">
                            {{ item }}
                        </div>
                        <div class="controller">
                            <font-awesome-icon
                                :icon="['fas', 'xmark']"
                                @click="onLoading = false; dataList = []" />
                            <font-awesome-icon
                                :icon="['fas', 'rotate']"
                                @click="dataList = []; onRobotClick()" />
                        </div>
                    </div>
                </div>
            </template>
        </chat>
    </div>
</template>

<script lang="ts">
import { defineComponent, toRaw } from 'vue'
import Chat from '../Chat.vue'
import app from '@renderer/main'
import { runtimeData } from '@renderer/function/msg'
import { get, save, optDefault } from '@renderer/function/option'
import { Logger, PopInfo, PopType } from '@renderer/function/base'
import { getViewTime } from '@renderer/function/utils/systemUtil'
import { getMsgRawTxt } from '@renderer/function/utils/msgUtil'
import xss from 'xss'

export default defineComponent({
    name: 'ChatGlagame',
    components: { Chat },
    props: ['chat', 'list', 'imgView'],
    data() {
        return {
            onLoading: false,
            dataList: [],
        }
    },
    methods: {
        onRobotClick() {
            const { $t } = app.config.globalProperties
            const logger = new Logger()
            const systemContent = get('glagame_prompt') ?? optDefault.glagame_prompt
            const maxMessages = Number(get('glagame_max_messages')) || optDefault.glagame_max_messages
            // 只取最多 maxMessages 条聊天记录
            const chatData = toRaw(runtimeData.messageList).filter(item => item.raw_message && item.sender.user_id !== runtimeData.loginInfo.uin).slice(-maxMessages)
            const chatStr = chatData.map(item => {
                return `【${getViewTime(item.time)}】${item.sender.nickname}: ${getMsgRawTxt(item)}`
            }).join('\n')
            logger.debug('聊天记录：' + chatStr)

            const curApi = get('openai_api') ?? ''
            const curToken = get('openai_token') ?? ''
            const curModel = get('openai_model') ?? 'gpt-4o'
            if (!curApi || !curToken) {
                this.openAPIConfig()
                return
            }
            // 请求 OpenAPI
            this.onLoading = true
            fetch(curApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${curToken}`,
                },
                body: JSON.stringify({
                    'model': curModel,
                    'messages': [
                        { 'role': 'system', 'content': systemContent },
                        { 'role': 'user', 'content': chatStr }
                    ],
                    stream: false,
                }),
            }).then(response => response.json())
                .then(data => {
                    this.onLoading = false
                    this.dataList = data.choices?.[0]?.message?.content?.trim().split('\n') || []
                })
                .catch(error => {
                    this.onLoading = false
                    new PopInfo().add(PopType.ERR, $t('请求失败：') + error.message);
                });
        },
        openAPIConfig() {
            const { $t } = app.config.globalProperties
            const curApi = xss(get('openai_api') ?? '')
            const curToken = xss(get('openai_token') ?? '')
            const curModel = xss(get('openai_model') ?? 'gpt-4o')
            const curPrompt = xss(get('glagame_prompt') ?? optDefault.glagame_prompt)
            const curMaxMessages = Number(get('glagame_max_messages')) || optDefault.glagame_max_messages

            const popInfo = {
                title: 'OpenAPI 设置',
                html: `<div class="glagame-api-config">
                    <div style="margin-bottom:8px;"><label>API 地址</label><br /><input id="glagame_api_input" type="text" value="${String(curApi).replaceAll(/"/g, '&quot;')}" /></div>
                    <div style="margin-bottom:8px;"><label>Token</label><br /><input id="glagame_token_input" type="text" value="${String(curToken).replaceAll(/"/g, '&quot;')}" /></div>
                    <div style="margin-bottom:8px;"><label>模型名称</label><br /><input id="glagame_model_input" type="text" value="${String(curModel).replaceAll(/"/g, '&quot;')}" /></div>
                    <div style="margin-bottom:8px;"><label>最大消息数</label><br /><input id="glagame_max_messages_input" type="number" value="${curMaxMessages}" min="1" max="200" /></div>
                    <div><label>Prompt</label><br /><textarea id="glagame_prompt_input" style="min-height:120px;resize:vertical">${String(curPrompt).replaceAll(/</g, '&lt;').replaceAll(/>/g, '&gt;')}</textarea></div>
                </div>`,
                button: [
                    {
                        text: $t('取消'),
                        fun: () => {
                            runtimeData.popBoxList.shift()
                        },
                    },
                    {
                        text: $t('保存'),
                        master: true,
                        fun: () => {
                            const apiEl = document.getElementById('glagame_api_input')
                            const tokenEl = document.getElementById('glagame_token_input')
                            const modelEl = document.getElementById('glagame_model_input')
                            const maxMessagesEl = document.getElementById('glagame_max_messages_input')
                            const promptEl = document.getElementById('glagame_prompt_input')
                            const api = apiEl && apiEl instanceof HTMLInputElement ? apiEl.value : ''
                            const token = tokenEl && tokenEl instanceof HTMLInputElement ? tokenEl.value : ''
                            const model = modelEl && modelEl instanceof HTMLInputElement ? modelEl.value : ''
                            const maxMessages = maxMessagesEl && maxMessagesEl instanceof HTMLInputElement ? Number(maxMessagesEl.value) || optDefault.glagame_max_messages : optDefault.glagame_max_messages
                            const prompt = promptEl && promptEl instanceof HTMLTextAreaElement ? promptEl.value : ''
                            // 保存设置
                            save('openai_api', api)
                            save('openai_token', token)
                            save('openai_model', model)
                            save('glagame_max_messages', maxMessages)
                            save('glagame_prompt', prompt)
                            runtimeData.popBoxList.shift()
                        },
                    },
                ],
            }

            runtimeData.popBoxList.push(popInfo)
        },
        selectChoice(item) {
            this.onLoading = false
            this.dataList = []

            const input = document.getElementById('main-input')
            if (input) {
                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                    input.value = item
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                    input.focus()
                } else {
                    input.textContent = String(item)
                }
            }
        },
    },
})
</script>

<style scoped>
.chat-extra {
    padding-top: 20px;
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: all;
    background: rgba(var(--color-card-rgb), 0.7);
}
.chat-extra .load {
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 5px var(--color-shader);
}
.chat-extra .options {
    flex-direction: column;
    width: 100%;
    align-items: center;
    display: flex;
    gap: 20px;
}
.chat-extra .options > div {
    cursor: pointer;
    border-radius: 7px;
    box-shadow: 0 0 5px var(--color-shader);
    background: var(--color-card);
    padding: 10px;
    width: 70%;
    text-align: center;
    line-height: 25px;
    font-size: 0.8rem;
}
.chat-extra .options > div.controller {
    background: unset;
    box-shadow: unset;
}
.chat-extra .options svg {
    margin: 10px;
    cursor: pointer;
    width: 15px;
    height: 15px;
    box-shadow: 0 0 5px var(--color-shader);
    background: var(--color-card);
    padding: 15px;
    border-radius: 100%;
    margin-top: 30px;
}
</style>
<style>
.glagame-api-config {
    width: calc(100% - 10px);
    max-height: 55vh;
    overflow-y: scroll;
    overflow-x: hidden;
    padding-right: 10px;
}
.glagame-api-config input,
.glagame-api-config textarea {
    color: var(--color-font);
    width: calc(100% - 20px);
    background: var(--color-card-1);
    border: unset;
    padding: 10px;
    margin: 5px 0 10px 0;
    border-radius: 7px;
}
</style>
