<template>
    <div class="msg-json" v-if="success" @click="openLink(data.jumpUrl)">
        <p>{{ data.title }}</p>
        <span>{{ data.desc }}</span>
        <img :src="data.img" alt="" />
        <div class="bottom-bar">
            <img :src="data.icon" alt="" />
            <span>{{ data.name }}</span>
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

const tuwen = z
    .object({
        app: z.literal('com.tencent.tuwen.lua'),
        meta: z.object({
            news: z.object({
                title: z.string(),
                desc: z.string(),
                jumpUrl: z.string(),
                preview: z.string(),
                tagIcon: z.string(),
                tag: z.string(),
            }),
        }),
    })
    .transform((o) => ({
        title: o.meta.news.title,
        desc: o.meta.news.desc,
        jumpUrl: o.meta.news.jumpUrl,
        img: o.meta.news.preview,
        icon: o.meta.news.tagIcon,
        name: o.meta.news.tag,
    }))

const json = JSON.parse(jsonData)
const parsedData = tuwen.safeParse(json)
const success = parsedData.success
const data = parsedData.data!
if (!success) {
    new Logger().error(parsedData.error, 'Map Card Parse Error')
}
</script>
