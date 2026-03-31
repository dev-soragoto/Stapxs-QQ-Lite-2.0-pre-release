<template>
    <div v-if="success" class="msg-json" @click="openLink(parsedContent.jumpUrl)">
        <p>{{ parsedContent.title }}</p>
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
import { Logger } from '@renderer/function/base'
import { openLink } from '@renderer/function/utils/appUtil'
import * as z from 'zod'

const { data: jsonData, id } = defineProps<{
    data: string,
    id: string,
}>()

const miniapp = z
    .object({
        app: z.literal('com.tencent.miniapp_01'),
        meta: z.object({
            detail_1: z.object({
                title: z.string(),
                desc: z.string(),
                icon: z.string(),
                preview: z.string(),
                qqdocurl: z.string(),
            }),
        }),
    })
    .transform((o) => ({
        title: o.meta.detail_1.desc,
        jumpUrl: o.meta.detail_1.qqdocurl,
        img: o.meta.detail_1.preview,
        icon: o.meta.detail_1.icon,
        name: o.meta.detail_1.title,
    }))

const json = JSON.parse(jsonData)
const parsedData = miniapp.safeParse(json)
const success = parsedData.success
const parsedContent = parsedData.data!
if (!success) {
    new Logger().error(parsedData.error, 'Card Parse Error')
}
</script>
