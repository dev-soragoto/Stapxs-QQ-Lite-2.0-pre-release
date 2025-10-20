<template>
    <div ref="lottieContainer" class="lazy-lottie">
        <Lottie
            v-if="shouldRender"
            ref="lottieRef"
            :animation-link="animationLink"
            :title="title"
            :auto-play="false" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Vue3Lottie as Lottie } from 'vue3-lottie'

defineProps<{
    animationLink: string
    title?: string
}>()

const lottieContainer = ref<HTMLElement | null>(null)
const lottieRef = ref<any>(null)
const shouldRender = ref(false)
let observer: IntersectionObserver | null = null

const playAnimation = () => {
    if (!lottieRef.value) return
    try {
        lottieRef.value.play?.()
    } catch (e) {
        console.error('Lottie play error:', e)
    }
}

const pauseAnimation = () => {
    if (lottieRef.value) {
        lottieRef.value.pause?.()
    }
}

onMounted(() => {
    if (!lottieContainer.value) return

    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    // 至少 50% 可见才渲染和播放
                    if (!shouldRender.value) {
                        shouldRender.value = true
                        setTimeout(playAnimation, 0)
                    } else {
                        playAnimation()
                    }
                } else if (entry.intersectionRatio < 0.1) {
                    // 几乎不可见时暂停
                    pauseAnimation()
                }
            })
        },
        {
            rootMargin: '50px',
            threshold: [0.1, 0.5, 0.9]
        }
    )

    observer.observe(lottieContainer.value)

    // 立即检查是否已经在视口内
    const rect = lottieContainer.value.getBoundingClientRect()
    const windowHeight = window.innerHeight || document.documentElement.clientHeight
    const isVisible = rect.top >= 0 && rect.bottom <= windowHeight &&
                     rect.height > 0 && (rect.height / (rect.bottom - rect.top)) >= 0.5

    if (isVisible && !shouldRender.value) {
        shouldRender.value = true
        setTimeout(playAnimation, 0)
    }
})

onUnmounted(() => {
    pauseAnimation()
    if (observer && lottieContainer.value) {
        observer.unobserve(lottieContainer.value)
        observer.disconnect()
        observer = null
    }
})
</script>

<style scoped>
.lazy-lottie {
    display: inline-block;
    min-height: 100px;
    min-width: 100px;
}
</style>
