<!--
 * @FileDescription: 通知消息模板
 * @Author: Stapxs
 * @Date: 2022/12/04
 * @Version: 1.0
-->

<template>
    <div :id="'notice-' + id"
        class="note">
        <div v-if="data.notice_type && data.notice_type.indexOf('recall') >= 0" class="note-recall note-base">
            <a>{{ info.name }}</a>
            <span>{{ $t('撤回了一条消息') }}</span>
            <div />
        </div>
        <div v-else-if="data.notice_type == 'group_ban'" class="note-ban note-base">
            <template v-if="data.sub_type === 'ban'">
                <template v-if="isMe(data.user_id)">
                    <span>{{ $t('成员类型_admin') }}</span>
                    <a>&nbsp;{{ getName(data.operator_id) }}&nbsp;</a>
                    <span>{{ $t('禁言了你') }}</span>
                    <span>&nbsp;{{ fTime(data.duration) }}</span>
                </template>
                <template v-else>
                    <span>{{ $t('管理员禁言了') }}</span>
                    <a>&nbsp;{{ getName(data.user_id) }}&nbsp;</a>
                    <span>{{ fTime(data.duration) }}</span>
                </template>
            </template>
            <span v-else>{{
                $t('管理员解除了 {name} 的禁言', { name: isMe(data.user_id) ? $t('你') : getName(data.user_id)})
            }}</span>
        </div>
        <div v-else-if="data.sub_type === 'delete'" class="note-recall note-base">
            <span>{{ $t('这条消息迷失在虚空里了') }}</span>
            <div />
        </div>
        <div v-else-if="data.sub_type === 'poke'"
            class="note-notify note-base"
            v-html="data.str + '<div class=\'space\'</div>'" />
        <div v-else-if="data.sub_type === 'time' && data.time != undefined"
            class="note-time note-base">
            <a>{{ Intl.DateTimeFormat(
                trueLang,
                getTimeConfig(new Date(data.time * 1000)),
            ).format(new Date(data.time * 1000))
            }}</a>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import {
        getTimeConfig,
        getTrueLang,
        callBackend,
    } from '@renderer/function/utils/systemUtil'
    import { pokeAnime } from '@renderer/function/utils/msgUtil'

    export default defineComponent({
        name: 'NoticeBody',
        props: ['data', 'id'],
        data() {
            return {
                trueLang: getTrueLang(),
                getTimeConfig,
                info: ref(this.data) as { [key: string]: any },
            }
        },
        async mounted() {
            let windowInfo = null as {
                x: number
                y: number
                width: number
                height: number
            } | null
            windowInfo = await callBackend(undefined, 'win:getWindowInfo', true)
            // 补全撤回者信息
            if (
                this.info.notice_type &&
                this.info.notice_type.indexOf('recall') >= 0
            ) {
                if (runtimeData.chatInfo.show.type === 'group') {
                    const id = this.info.operator_id
                    // 寻找群成员信息
                    if (runtimeData.chatInfo.info.group_members !== undefined) {
                        const back =
                            runtimeData.chatInfo.info.group_members.filter(
                                (item) => {
                                    return item.user_id === Number(id)
                                },
                            )
                        if (back.length === 1) {
                            this.info.name =
                                back[0].card === '' || back[0].card == null? back[0].nickname: back[0].card
                        } else {
                            this.info.name = id
                        }
                    } else {
                        this.info.name = id
                    }
                } else {
                    this.info.name = runtimeData.chatInfo.show.name
                }
            }
            // poke 通知创建对应的动画
            // PS：只有最后一条 poke 通知会触发动画，避免反复触发动画
            if (this.info.sub_type === 'poke' && this.info.pokeMe &&
                this.info == runtimeData.messageList[runtimeData.messageList.length - 1]) {
                    let item = document.getElementById('app')
                    if (['electron', 'tauri'].includes(runtimeData.tags.clientType)) {
                        item = document.getElementById('notice-' + this.id)?.getElementsByClassName('space')[0] as HTMLElement
                    }
                    pokeAnime(item, windowInfo)
            }
        },
        methods: {
            isMe(id: number) {
                return runtimeData.loginInfo.uin === id
            },
            getName(id: number) {
                const back = runtimeData.chatInfo.info.group_members.filter(
                    (item) => {
                        return item.user_id === id
                    },
                )
                if (back.length === 1) {
                    return back[0].card === '' || back[0].card == null? back[0].nickname: back[0].card
                }
                return id
            },
            fTime(time: number) {
                // 将秒数转换为可阅读的时间，最大单位天
                const day = Math.floor(time / 86400)
                const hour = Math.floor((time % 86400) / 3600)
                const minute = Math.floor((time % 3600) / 60)
                const second = time % 60

                let back = ''
                if (day > 0) {
                    back += `${day} ${this.$t('天')} `
                }
                if (hour > 0) {
                    back += `${hour} ${this.$t('小时')} `
                }
                if (minute > 0) {
                    back += `${minute} ${this.$t('分钟')} `
                }
                if (second > 0) {
                    back += `${second} ${this.$t('秒')} `
                }
                return back
            },
        },
    })
</script>
