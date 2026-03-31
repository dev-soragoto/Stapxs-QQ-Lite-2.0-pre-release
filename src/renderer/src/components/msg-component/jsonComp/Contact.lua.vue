<template>
    <div v-if="success" class="msg-json">
        <p>{{ parsedContent.title }}</p>
        <span v-if="parsedContent.type === 'group'">{{ parsedContent.desc }}</span>
        <img :src="parsedContent.img" alt="">
        <div class="bottom-bar">
            <font-awesome-icon
                v-if="parsedContent.type === 'group'"
                :icon="['fas', 'users']" />
            <font-awesome-icon v-else :icon="['fas', 'user']" />
            <span>{{ parsedContent.name }}</span>
        </div>
    </div>
    <span v-else class="msg-unknown">{{
        '( ' + $t('加载失败') + ': ' + id + ' )'
    }}</span>
</template>

<script setup lang="ts">
import { Logger } from '@renderer/function/base';
import * as z from 'zod'

const { data: jsonData, id } = defineProps<{
    data: string,
    id: string,
}>()

const friend = z
    .object({
        app: z.literal('com.tencent.contact.lua'),
        meta: z.object({
            contact: z.object({
                avatar: z.string(),
                nickname: z.string(),
                contact: z.string(),
                jumpUrl: z.string(),
                tag: z.literal('推荐好友'),
            }),
        }),
    })
    .transform((o) => ({
        type: 'user' as const,
        img: o.meta.contact.avatar,
        title: o.meta.contact.nickname,
        jumpUrl: o.meta.contact.jumpUrl,
        name: o.meta.contact.tag,
    }))

const group = z
    .object({
        app: z.literal('com.tencent.contact.lua'),
        meta: z.object({
            contact: z.object({
                avatar: z.string().transform((s) => s.replace('/100', '/')),
                nickname: z.string(),
                contact: z.string().transform((s) => `${s}…`),
                jumpUrl: z.string(),
                tag: z.literal('群名片'),
            }),
        }),
    })
    .transform((o) => ({
        type: 'group' as const,
        img: o.meta.contact.avatar,
        title: o.meta.contact.nickname,
        desc: o.meta.contact.contact,
        jumpUrl: o.meta.contact.jumpUrl,
        name: o.meta.contact.tag,
    }))

const contact = z.union([friend, group])

const json = JSON.parse(jsonData)
const parsedData = contact.safeParse(json)
const success = parsedData.success
const parsedContent = parsedData.data!
if (!success) {
    new Logger().error(parsedData.error, 'Card Parse Error')
}
</script>
