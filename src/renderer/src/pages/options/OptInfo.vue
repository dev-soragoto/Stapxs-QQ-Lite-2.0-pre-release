<!--
 - @FileDescription: 设置页面（群/好友设置页面）
 - @Author: Stapxs
 - @Date: 2023/2/7
 - @Version: 1.0 - 初始版本
-->

<template>
    <div
        class="info-pan-set"
        style="padding: 0">
        <!-- 公用设置 -->
        <!-- 群设置 -->
        <template v-if="type == 'group'">
            <div v-if="runtimeData.chatInfo.info.me_info.role == 'owner' ||
                     runtimeData.chatInfo.info.me_info.role == 'admin'"
                class="opt-item">
                <font-awesome-icon :icon="['fas', 'pen']" />
                <div>
                    <span>{{ $t('群聊名称') }}</span>
                    <span>{{ $t('“你们真是害人不浅呐你们这个群”') }}</span>
                </div>
                <input v-model="runtimeData.chatInfo.show.name" class="ss-input"
                    style="width: 150px" type="text" @keyup="setGroupName">
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'note-sticky']" />
                <div>
                    <span>{{ $t('我的群昵称') }}</span>
                    <span>{{ $t('￡爺↘僞ηι慹著彡') }}</span>
                </div>
                <input v-model="runtimeData.chatInfo.info.me_info.card" class="ss-input"
                    style="width: 150px" type="text" @change="setGroupCard">
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'bell']" />
                <div>
                    <span>{{ $t('通知群消息') }}</span>
                    <span>{{ $t('快来水群快来水群！') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="canGroupNotice" type="checkbox"
                        name="opt_dark" @change="setGroupNotice">
                    <div>
                        <div />
                    </div>
                </label>
            </div>

            <button class="ss-button"
                style="width: calc(100% - 60px); margin: 10px 30px 0 30px"
                @click="leaveGroup()">
                {{ $t('退出群聊') }}
            </button>
        </template>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import { Connector } from '@renderer/function/connect'
    import { changeGroupNotice, reloadUsers } from '@renderer/function/utils/appUtil'
    import { canGroupNotice } from '@renderer/function/utils/msgUtil'

    export default defineComponent({
        name: 'ViewOptInfo',
        props: ['type', 'chat'],
        emits: ['update_mumber_card'],
        data() {
            return {
                canGroupNotice: canGroupNotice,
                runtimeData: runtimeData,
            }
        },
        methods: {
            /**
            * 设置群消息通知
            * @param event 输入事件
            */
            setGroupNotice(event: Event) {
                const status = (event.target as HTMLInputElement).checked
                changeGroupNotice(this.chat.show.id, status)
            },

            /**
             * 设置群名片
             * @param event 按键事件
             */
            setGroupCard(event: Event) {
                this.$emit('update_mumber_card', event, runtimeData.chatInfo.info.me_info)
            },

            /**
             * 设置群名
             * @param event 按键事件
             */
            setGroupName(event: KeyboardEvent) {
                if (
                    event.key === 'Enter' &&
                    runtimeData.chatInfo.show.name != ''
                ) {
                    Connector.send(
                        'set_group_name',
                        {
                            group_id: this.chat.show.id,
                            group_name: runtimeData.chatInfo.show.name,
                        },
                        'setGroupName',
                    )
                }
            },

            /**
             * 退出群聊
             */
            leaveGroup() {
                const popInfo = {
                    html: '<span>' + this.$t('确定要退出群聊吗？') + '</span>',
                    button: [
                        {
                            text: this.$t('确定'),
                            fun: () => {
                                if (runtimeData.jsonMap.leave_group?.name) {
                                    Connector.send(runtimeData.jsonMap.leave_group?.name,
                                        { group_id: this.chat.show.id },
                                        'leaveGroup')
                                }
                                // 从消息列表中删除该群聊
                                runtimeData.baseOnMsgList =
                                    runtimeData.baseOnMsgList.filter(
                                        (item: any) => item.group_id !== this.chat.show.id)
                                // 关闭群聊窗口
                                runtimeData.chatInfo.show.id = 0
                                // 刷新好友/群列表
                                reloadUsers()
                                runtimeData.popBoxList.shift()
                            },
                        },
                        {
                            text: this.$t('取消'),
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
    })
</script>

<style scoped>
    .opt-item:hover input[type='text'] {
        background: var(--color-card-2);
        transition: background 0.2s;
    }
</style>
