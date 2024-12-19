<!--
 * @FileDescription: 公告列表项模板
 * @Author: Stapxs
 * @Date: 2022-12-01
 * @Version: 1.0
-->

<template>
    <div
        class="base"
        @click="showAll = !showAll">
        <header>
            <font-awesome-icon :icon="['fas', 'bookmark']" />
            <span>{{ $t('公告') }}</span>
            <div style="flex: 1" />
            <span>{{
                Intl.DateTimeFormat(trueLang, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                }).format(data.time)
            }}</span>
        </header>
        <div
            :id="'bulletins-msg-' + index"
            :class="'body' + (!showAll ? '' : ' all')">
            <span
                @click="textClick"
                v-html="parseText(data.content[0])" />
        </div>
        <span v-show="needShow && !showAll">{{ $t('点击展开') }}</span>
        <div class="info">
            <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender">
            <a>{{
                runtimeData.chatInfo.info.group_members.filter((item) => {
                    return Number(item.user_id) === Number(data.sender)
                })[0].nickname
            }}</a>
            <div />
            <span v-if="data.is_read">{{
                $t('{readNum} 人已读 | {isRead}', {
                    isRead: data.is_read ? $t('已读') : $t('未读'),
                    readNum: data.read_num,
                })
            }}</span>
        </div>
    </div>
</template>

<script lang="ts">
    import xss from 'xss'
    import { defineComponent } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import { openLink } from '@renderer/function/utils/appUtil'
    import { getTrueLang } from '@renderer/function/utils/systemUtil'

    export default defineComponent({
        name: 'BulletinBody',
        props: ['data', 'index'],
        data() {
            return {
                trueLang: getTrueLang(),
                runtimeData: runtimeData,
                showAll: false,
                needShow: true,
            }
        },
        mounted() {
            this.$nextTick(() => {
                const tab1 = document.getElementById('info-pan-notices')
                const tab2 = document.getElementById('info-pan-mumber')
                const pan = document.getElementById(
                    'bulletins-msg-' + this.index,
                )
                if (pan && tab1 && tab2) {
                    // PS：display none 不渲染无法获取实际高度
                    tab1.click()
                    const maxHeight = Number(
                        getComputedStyle(pan).maxHeight.replace('px', ''),
                    )
                    const height = pan.offsetHeight
                    tab2.click()
                    this.needShow = height == maxHeight
                }
            })
        },
        methods: {
            parseText(text: string) {
                text = text
                    .replaceAll('\r', '\n')
                    .replaceAll('\n\n', '\n')
                    .replaceAll('&#10;', '\n')
                text = xss(text, { whiteList: { a: ['href', 'target'] } })
                // 匹配链接
                const reg =
                    /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/gi
                text = text.replaceAll(
                    reg,
                    '<a href="" data-link="$&" onclick="return false">$&</a>',
                )
                return text
            },
            textClick(event: Event) {
                const target = event.target as HTMLElement
                if (target.dataset.link) {
                    // 点击了链接
                    const link = target.dataset.link
                    openLink(link)
                }
            },
        },
    })
</script>
