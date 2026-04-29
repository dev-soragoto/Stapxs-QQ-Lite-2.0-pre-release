<!--
 * @FileDescription: 公告列表项模板
 * @Author: Stapxs
 * @Date: 2022-12-01
 * @Version: 1.0
-->

<template>
    <div class="base"
        @click="showAll = !showAll">
        <header>
            <font-awesome-icon :icon="['fas', 'bookmark']" />
            <span>{{ $t('公告') }}</span>
            <div style="flex: 1" />
            <span>{{ Intl.DateTimeFormat(trueLang, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
            }).format(data.time) }}</span>
        </header>
        <div :id="'bulletins-msg-' + index"
            :class="'body' + (!showAll ? '' : ' all')">
            <span
                style="margin-right: auto;margin-bottom: auto;"
                @click="textClick"
                v-html="parseText(data.content[0])" />
            <img v-if="data.img"
                :src="data.img.src"
                :class="{
                    img: true,
                    all: showAll,
                }"
                @click.stop="imgClick(data.img)">
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

<script lang="ts" setup>
    import xss from 'xss'
    import { ref, onMounted, nextTick, inject } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import { openLink } from '@renderer/function/utils/appUtil'
    import { getTrueLang } from '@renderer/function/utils/systemUtil'
    import { i18n } from '@renderer/main'
    import { Img } from '@renderer/function/model/img'

    defineOptions({ name: 'BulletinBody' })

    const $t = i18n.global.t

    const props = defineProps<{
        data: any
        index: number
    }>()

    const viewer = inject<any>('viewer')

    const trueLang = getTrueLang()
    const showAll = ref(false)
    const needShow = ref(true)

    onMounted(() => {
        nextTick(() => {
            const tab1 = document.getElementById('info-pan-notices')
            const tab2 = document.getElementById('info-pan-mumber')
            const pan = document.getElementById(
                'bulletins-msg-' + props.index,
            )
            if (pan && tab1 && tab2) {
                // PS：display none 不渲染无法获取实际高度
                tab1.click()
                const maxHeight = Number(
                    getComputedStyle(pan).maxHeight.replace('px', ''),
                )
                const height = pan.offsetHeight
                tab2.click()
                needShow.value = height == maxHeight
            }
        })
    })

    function parseText(text: string) {
        text = text.replaceAll('\r', '\n')
            .replaceAll('\n\n', '\n')
            .replaceAll('&#10;', '\n')
        text = xss(text, { whiteList: { a: ['href', 'target'] } })
        // 匹配链接
        const reg = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/gi
        text = text.replaceAll(reg, '<a href="" data-link="$&" onclick="return false">$&</a>')
        return text
    }

    function textClick(event: Event) {
        const target = event.target as HTMLElement
        if (target.dataset.link) {
            // 点击了链接
            const link = target.dataset.link
            openLink(link)
        }
    }

    function _getSenderName(): string {
        const result = runtimeData.chatInfo.info.group_members.filter((item) => {
            return Number(item.user_id) === Number(props.data.sender)
        }).at(0)?.nickname
        return result ?? $t('已退群( {userId} )', { userId: Number(props.data.sender) })
    }

    /**
     * 图片点击
     * @param img
     */
    function imgClick(img: Img) {
        if (viewer) {
            (viewer as any).open(img)
        }
    }
</script>
