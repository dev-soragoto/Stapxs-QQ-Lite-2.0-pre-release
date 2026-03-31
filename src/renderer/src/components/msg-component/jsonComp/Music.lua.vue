<template>
    <div v-if="success" class="msg-json" @click="openLink(parsedContent.jumpUrl)">
        <p>{{ parsedContent.title }}</p>
        <span>{{ parsedContent.desc }}</span>
        <img :src="parsedContent.img" alt="">
        <div class="bottom-bar">
            <img :src="parsedContent.icon" alt="">
            <span>{{ parsedContent.name }}</span>
        </div>
    </div>
    <span v-else class="msg-unknown">{{
        '( ' + $t('加载失败') + ': ' + id + ' )'
    }}</span>
</template>

<script setup lang="ts">
import { Logger } from '@renderer/function/base';
import { openLink } from '@renderer/function/utils/appUtil'
import * as z from 'zod'

const { data: jsonData, id } = defineProps<{
    data: string,
    id: string,
}>()

const music = z
    .object({
        app: z.literal('com.tencent.music.lua'),
        meta: z.object({
            music: z.object({
                title: z.string(),
                desc: z.string(),
                jumpUrl: z.string(),
                musicUrl: z.string(),
                preview: z.string(),
                tagIcon: z.string(),
                tag: z.string(),
            }),
        }),
    })
    .transform((o) => ({
        title: o.meta.music.title,
        desc: o.meta.music.desc,
        jumpUrl: o.meta.music.jumpUrl,
        musicUrl: o.meta.music.musicUrl,
        img: o.meta.music.preview,
        icon: o.meta.music.tagIcon,
        name: o.meta.music.tag,
    }))
// TODO 播放音乐
const json = JSON.parse(jsonData)
const parsedData = music.safeParse(json)
const success = parsedData.success
const parsedContent = parsedData.data!
if (!success) {
    new Logger().error(parsedData.error, 'Card Parse Error')
}
</script>
