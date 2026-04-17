<template>
    <div class="music-controller">
        <div>
            <img :src="currentMusic?.cover">
            <div>
                <a>{{ currentMusic?.title }}
                    <a v-if="currentMusic?.free != null">{{ $t('（试听）') }}</a>
                    <span> / {{ currentMusic?.author.join('/') }}</span>
                </a>
                <audio :src="backend.proxyUrl(currentMusic?.url ?? '')"
                    @loadedmetadata="audioLoaded"
                    @timeupdate="audioUpdate()" />
                <div>
                    <input id="music-controller-bar" value="0" min="0"
                        :max="sizeMax" step="0.1" type="range"
                        @input="audioChange">
                    <div>
                        <div :style="{
                            width: sizeDur / sizeMax * 100 > 100 ? '100%' : (sizeDur / sizeMax * 100) + '%',
                        }" />
                        <div :style="{
                            width: sizeReal > 0 ? ((1 - sizeMax / sizeReal) * 100) + '%' : '0%',
                            marginLeft: sizeReal > 0 ? (sizeMax / sizeReal * 100) + '%' : '',
                        }" />
                    </div>
                    <font-awesome-icon v-if="!isLoaded" :icon="['fas', 'spinner']" spin />
                    <template v-else>
                        <font-awesome-icon v-if="audio?.paused" :icon="['fas', 'play']" @click="audioControll()" />
                        <font-awesome-icon v-else :icon="['fas', 'pause']" @click="audioControll()" />
                    </template>
                    <font-awesome-icon v-if="musicList.length > 1" :icon="['fas', 'forward']" @click="switchMusic(currentIndex + 1, true)" />
                    <span>{{ minutesDur < 10 ? '0' + minutesDur : minutesDur }}:{{ secondsDur < 10 ? '0' + secondsDur : secondsDur }} / {{ minutes < 10 ? '0' + minutes : minutes }}:{{ seconds < 10 ? '0' + seconds : seconds }}</span>
                </div>
            </div>
        </div>
    </div>
    <div class="music-list">
        <template v-if="false">
            播放列表为空
        </template>
        <template v-else>
            <div
                v-for="(music, index) in musicList"
                :key="`${music.type}-${music.url}-${index}`"
                @click="switchMusic(index)">
                <div :style="{ opacity: index === currentIndex ? 1 : 0 }" />
                <img :src="music.cover">
                <span>{{ music.title }} - {{ music.author.join('/') }}</span>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
    import { computed, defineComponent, ref } from 'vue'
    import { backend } from '@renderer/runtime/backend'

    export interface MusicInfo {
        title: string,                  // 标题
        author: string[],               // 作者
        url: string,                    // 音乐链接
        type: 'default' | 'music163',   // 音乐类型（用于特殊功能）
        cover: string,                  // 封面链接
        free?: boolean                  // 试听标识
        time?: number                   // 音频时长
    }

    const emit = ref(undefined as any)
    const resetController = ref(() => {})

    const musicListState = ref<MusicInfo[]>([])
    const currentIndexState = ref(0)
    const readyToPlayState = ref(false)
    const audoState = ref(null as HTMLAudioElement | null)

    export const getCurrentMusic = () => {
        if (currentIndexState.value < 0 || currentIndexState.value >= musicListState.value.length) {
            return null
        }

        return musicListState.value[currentIndexState.value]
    }

    export const addMusic = (info: MusicInfo, type: 'top' | 'bottom' | 'current' = 'bottom', open: boolean = false) => {
        // 筛选掉同 title 的
        musicListState.value = musicListState.value.filter(item => {
            return item.title !== info.title
        })
        if (type === 'top') {
            musicListState.value.unshift(info)
            currentIndexState.value++
        } else if (type === 'current') {
            if(audoState.value?.played) {
                audoState.value.pause
                musicListState.value.unshift(info)
                currentIndexState.value = 0
            } else {
                musicListState.value.unshift(info)
            }
            resetController.value()
            readyToPlayState.value = true
        } else {
            musicListState.value.push(info)
        }

        if (open) {
            emit.value('open-panel', true)
        }
    }

    export default defineComponent({
        name: 'MusicPlayer',
        emits: ['open-panel'],
        setup(_, context) {
            emit.value = context.emit
            const audio = audoState

            const musicList = musicListState
            const currentIndex = currentIndexState
            const readyToPlay = readyToPlayState
            const isLoaded = ref(false)

            const sizeMax = ref(0)
            const sizeReal = ref(0)
            const sizeDur = ref(0)

            const minutes = ref(0)
            const seconds = ref(0)
            const minutesDur = ref(0)
            const secondsDur = ref(0)

            const currentMusic = computed(() => {
                if (currentIndex.value < 0 || currentIndex.value >= musicList.value.length) {
                    return null
                }
                return musicList.value[currentIndex.value]
            })

            resetController.value = () => {
                isLoaded.value = false
                sizeMax.value = 0
                sizeReal.value = 0
                sizeDur.value = 0
                minutes.value = 0
                seconds.value = 0
                minutesDur.value = 0
                secondsDur.value = 0
            }

            const switchMusic = (index: number, pass: boolean = false) => {
                if(pass) {
                    musicList.value.splice(currentIndex.value, 1)
                    if(currentIndex.value >= musicList.value.length) {
                        currentIndex.value = musicList.value.length - 1
                    }
                }
                resetController.value()

                const music = musicList.value[index]
                addMusic(music, 'current')
            }

            const audioLoaded = (event: any) => {
                isLoaded.value = true
                audio.value = event.target as HTMLAudioElement
                sizeMax.value = currentMusic.value?.time ?? audio.value.duration
                sizeReal.value = audio.value.duration
                minutes.value = Math.floor(sizeMax.value / 60)
                seconds.value = Math.floor(sizeMax.value % 60)
                if(readyToPlay.value) {
                    audio.value.play()
                    readyToPlay.value = false
                }
            }

            const audioUpdate = () => {
                if(audio.value) {
                    const bar = document.getElementById('music-controller-bar') as HTMLInputElement
                    if(bar) {
                        bar.value = audio.value.currentTime.toString()
                    }
                    sizeDur.value = audio.value.currentTime
                    minutesDur.value = Math.floor(audio.value.currentTime / 60)
                    secondsDur.value = Math.floor(audio.value.currentTime % 60)

                    if(audio.value.currentTime >= audio.value.duration) {
                        // 从列表移除并播放下一首
                        musicList.value.splice(currentIndex.value, 1)
                        if(currentIndex.value >= musicList.value.length) {
                            currentIndex.value = musicList.value.length - 1
                        }
                        if(currentIndex.value >= 0) {
                            audio.value.src = backend.proxyUrl(musicList.value[currentIndex.value].url)
                            readyToPlay.value = true
                        } else {
                            resetController.value()
                        }
                    }
                }
            }

            const audioChange = (event: any) => {
                const bar = event.target as HTMLInputElement
                if (audio.value) {
                    const value = parseFloat(bar.value)
                    if(value <= audio.value.duration) {
                        if(audio.value.paused) {
                            audio.value.currentTime = value
                        } else {
                            audio.value.pause()
                            audio.value.currentTime = value
                            audio.value.play()
                        }
                    } else {
                        bar.value = audio.value.currentTime.toString()
                    }
                }
            }

            const audioControll = () => {
                if (audio.value) {
                    if (audio.value.paused) {
                        audio.value.play()
                    } else {
                        audio.value.pause()
                    }
                }
            }

            return {
                backend,
                musicList,
                currentIndex,
                currentMusic,
                audio,
                isLoaded,
                audioLoaded,
                audioUpdate,
                audioChange,
                audioControll,
                switchMusic,
                sizeMax,
                sizeReal,
                sizeDur,
                minutes,
                seconds,
                minutesDur,
                secondsDur,
            }
        },
    })
</script>

<style scoped>
    .music-controller {
        flex-direction: column;
        display: flex;
    }
    .music-controller > div:first-child {
        align-items: flex-start;
        display: flex;
    }
    .music-controller > div:first-child > img {
        border-radius: 7px;
        margin-right: 20px;
        max-height: 60px;
        width: 60px;
    }
    .music-controller > div:first-child > div {
        flex-direction: column;
        display: flex;
        width: 100%;
    }
    .music-controller > div:first-child > div > a {
        font-size: 0.9rem;
        font-weight: bold;
    }
    .music-controller > div:first-child > div > a > a {
        font-size: 0.7rem;
        font-weight: normal;
    }
    .music-controller > div:first-child > div > a > span {
        font-size: 0.8rem;
        opacity: 0.7;
    }
    .music-controller > div:first-child > div > div {
        flex-direction: row;
        margin-top: 5px;
        flex-wrap: wrap;
        display: flex;
    }
    .music-controller > div:first-child > div > div > input {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
        margin-bottom: 10px;
        margin-right: 10px;
    }
    .music-controller > div:first-child > div > div > input::-webkit-slider-thumb {
        background: var(--color-main);
        -webkit-appearance: none;
        border-radius: 100%;
        margin-top: -3px;
        height: 12px;
        width: 12px;
    }
    .music-controller > div:first-child > div.me > div > input::-webkit-slider-thumb {
        background: var(--color-font-r);
    }
    .music-controller > div:first-child > div > div > input::-webkit-slider-runnable-track {
        background: var(--color-card-1);
        border-radius: 10px;
        height: 6px;
    }
    .music-controller > div:first-child > div.me > div > input::-webkit-slider-runnable-track {
        background: var(--color-font-2);
    }
    .music-controller > div:first-child > div > div > svg {
        font-size: 0.75rem;
        margin-left: 4px;
        margin-right: 10px;
        cursor: pointer;
    }
    .music-controller > div:first-child > div > div > span {
        font-size: 0.75rem;
        text-align: right;
        margin-right: 10px;
        flex: 1;
    }
    .music-controller > div:first-child > div > div > div {
        width: calc(100% - 20px);
        margin-bottom: -6px;
        margin-right: 20px;
        margin-left: 3px;
    }
    .music-controller > div:first-child > div > div > div > div {
        transform: translateY(calc(-100% - 10px));
        background: var(--color-main);
        pointer-events: none;
        border-radius: 6px;
        height: 6px;
        width: 0%;
    }
    .music-controller > div:first-child > div > div > div > div:nth-child(2) {
        transform: translateY(calc(-100% - 16px));
        background: var(--color-card-2);
        border-radius: 0 6px 6px 0;
    }
    .music-controller > div:first-child > div.me > div > div > div:nth-child(2) {
        background: var(--color-font-1);
    }
    .music-controller > div:first-child > div.me > div > div > div {
        background: var(--color-font-r);
    }

    .music-list {
        background: var(--color-card-1);
        padding: 10px;
        margin-top: 10px;
        border-radius: 7px;
        max-height: 20vh;
        overflow-y: scroll;
    }
    .music-list > div {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
    }
    .music-list > div > div {
        width: 4px;
        height: 20px;
        background: var(--color-main);
        border-radius: 4px;
        margin-right: 10px;
    }
    .music-list img {
        width: 30px;
        height: 30px;
        margin-right: 10px;
        border-radius: 7px;
    }
    .music-list span {
        text-overflow: ellipsis;
        font-size: 0.8rem;
    }
</style>
