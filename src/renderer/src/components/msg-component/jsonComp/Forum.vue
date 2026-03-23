<template>
    <div class="msg-json" v-if="success" @click="openLink(data.jumpUrl)">
        <p>{{ data.title }}</p>
        <span>
            <font-awesome-icon icon="eye" /> {{ data.view }}
            <font-awesome-icon icon="message" /> {{ data.comment }}
            <font-awesome-icon icon="thumbs-up" /> {{ data.prefer }}
        </span>
        <img :src="data.img" alt="" />
        <div class="bottom-bar">
            <img :src="data.icon" alt="" />
            <span>{{ data.name }} ({{ $t('频道') }})</span>
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

const music = z
    .object({
        app: z.literal('com.tencent.forum'),
        meta: z.object({
            detail: z.object({
                channel_info: z.object({
                    guild_icon: z.string(),
                    guild_name: z.string(),
                }),
                feed: z.object({
                    comment_count: z.number(),
                    images: z.array(
                        z.object({
                            pic_url: z.string(),
                            height: z.number(),
                            width: z.number(),
                        }),
                    ),
                    prefer_count: z.number(),
                    view_count: z.number(),
                }),
                jump_url: z.string(),
            }),
        }),
        prompt: z.string(),
    })
    .transform((o) => ({
        title: o.prompt.replace('[频道帖子]', ''),
        view: o.meta.detail.feed.view_count,
        comment: o.meta.detail.feed.comment_count,
        prefer: o.meta.detail.feed.prefer_count,
        jumpUrl: o.meta.detail.jump_url,
        img: o.meta.detail.feed.images[0]?.pic_url,
        icon: o.meta.detail.channel_info.guild_icon,
        name: o.meta.detail.channel_info.guild_name,
    }))
const json = JSON.parse(jsonData)
const parsedData = music.safeParse(json)
const success = parsedData.success
const data = parsedData.data!
if (!success) {
    new Logger().error(parsedData.error, 'Card Parse Error')
}
</script>
