<!--
 * @FileDescription: 通知消息模板
 * @Author: Stapxs
 * @Date: 2022/12/04
 * @Version: 1.0
-->

<template>
    <div
        :id="'notice-' + id"
        class="note">
        <div
            v-if="data.notice_type && data.notice_type.indexOf('recall') >= 0"
            class="note-recall note-base">
            <a>{{ info.name }}</a>
            <span>{{ $t('撤回了一条消息') }}</span>
            <div />
        </div>
        <div
            v-if="data.notice_type == 'group_ban'"
            class="note-ban note-base">
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
                $t('管理员解除了 {name} 的禁言', {
                    name: isMe(data.user_id) ? $t('你') : getName(data.user_id),
                })
            }}</span>
        </div>
        <div
            v-if="data.sub_type === 'poke'"
            class="note-notify note-base"
            v-html="data.str + '<div class=\'space\'</div>'" />
        <div
            v-if="data.sub_type === 'time'"
            class="note-time note-base">
            <a>{{
                Intl.DateTimeFormat(
                    trueLang,
                    getTimeConfig(new Date(data.time * 1000)),
                ).format(new Date(data.time * 1000))
            }}</a>
        </div>
    </div>
</template>

<script lang="ts">
    import anime from 'animejs'

    import { defineComponent, ref } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import {
        getTimeConfig,
        getTrueLang,
    } from '@renderer/function/utils/systemUtil'

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
            if (runtimeData.tags.isElectron) {
                const reader = runtimeData.plantform.reader
                if (reader) {
                    windowInfo = await reader.invoke('win:getWindowInfo')
                }
            }
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
            if (this.info.sub_type === 'poke' && this.info.pokeMe) {
                // 给 body 创建一个三段的动画
                let item = document.getElementById('app')
                if (runtimeData.tags.isElectron) {
                    item = document
                        .getElementById('notice-' + this.id)
                        ?.getElementsByClassName('space')[0] as HTMLElement
                }
                if (item) {
                    const timeLine = anime.timeline({ targets: item })
                    // 如果窗口小于 500px 播放完整的动画（手机端样式）
                    if (
                        (document.getElementById('app')?.offsetWidth ?? 500) <
                        500
                    ) {
                        navigator.vibrate([10, 740, 10])
                        timeLine
                            .add({
                                translateX: 30,
                                duration: 600,
                                easing: 'cubicBezier(.44,.09,.53,1)',
                            })
                            .add({
                                translateX: 0,
                                duration: 150,
                                easing: 'cubicBezier(.44,.09,.53,1)',
                            })
                            .add({
                                translateX: [0, 25, 0],
                                duration: 500,
                                easing: 'cubicBezier(.21,.27,.82,.67)',
                            })
                            .add({ targets: {}, duration: 1000 })
                            .add({
                                translateX: 70,
                                duration: 1300,
                                easing: 'cubicBezier(.89,.72,.72,1.13)',
                            })
                            .add({
                                translateX: 0,
                                duration: 100,
                                easing: 'easeOutSine',
                            })
                    }
                    timeLine.add({
                        translateX: [-10, 10, -5, 5, 0],
                        duration: 500,
                        easing: 'cubicBezier(.44,.09,.53,1)',
                    })
                    timeLine.change = () => {
                        if (item) {
                            item.parentElement?.parentElement?.classList.add(
                                'poking',
                            )
                            const teansformX = item.style.transform
                            // teansformX 的数字可能是科学计数法，需要转换为普通数字
                            let num = Number(
                                (teansformX.match(/-?\d+\.?\d*/g) ?? [0])[0],
                            )
                            // 取整
                            num = Math.round(num)
                            // 输出 translateX
                            if (runtimeData.tags.isElectron && windowInfo) {
                                const reader = runtimeData.plantform.reader
                                if (reader) {
                                    reader.send('win:move', {
                                        x: windowInfo.x + num,
                                        y: windowInfo.y,
                                    })
                                }
                            }
                        }
                    }
                    timeLine.changeComplete = () => {
                        if (item) {
                            item.parentElement?.parentElement?.classList.remove(
                                'poking',
                            )
                        }
                    }
                }
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
