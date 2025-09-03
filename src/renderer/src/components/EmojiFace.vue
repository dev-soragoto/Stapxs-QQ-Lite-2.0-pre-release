<!--
 * @FileDescription: Emoji 表情
 * @Author: Mr.Lee
 * @Date: 2025/08/30
 * @Version: 1.0
-->
<template>
    <font-awesome-icon v-if="emoji === undefined"
        :icon="['fas', 'face-grin-wide']" class="emoji-face" />
    <img v-else-if="emoji.type === 'apng'" class="emoji-face" loading="lazy"
        :src="emoji.value">
    <span v-else class="emoji-face">{{ emoji.value }}</span>
</template>

<script setup lang="ts">
import Emoji from '@renderer/function/model/emoji'

const { emoji } = defineProps<{
    emoji?: Emoji
}>()
</script>
