import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useStickerStore = defineStore('sticker', () => {
    const stickerCache = shallowRef<any[]>([])

    return {
        stickerCache,
    }
})
