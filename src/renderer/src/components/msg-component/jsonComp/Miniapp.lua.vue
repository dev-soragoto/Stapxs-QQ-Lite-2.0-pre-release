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
        app: z.literal('com.tencent.miniapp.lua'),
        meta: z.object({
            miniapp: z.object({
                title: z.string(),
                source: z.string(),
                sourcelogo: z.url(),
                preview: z.string(),
                jumpUrl: z.url(),
            }),
        }),
    })
    .transform((o) => ({
        title: o.meta.miniapp.title,
        jumpUrl: o.meta.miniapp.jumpUrl,
        img: o.meta.miniapp.preview,
        icon: o.meta.miniapp.sourcelogo,
        name: o.meta.miniapp.source,
    }))


const json = JSON.parse(jsonData)
const parsedData = miniapp.safeParse(json)
const success = parsedData.success
const parsedContent = parsedData.data!
if (!success) {
    new Logger().error(parsedData.error, 'Card Parse Error')
}
</script>
