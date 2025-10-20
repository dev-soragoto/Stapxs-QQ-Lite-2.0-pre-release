<!--
 * @FileDescription: 表情面板模板
 * @Author: Stapxs
 * @Date: missing
 * @Version: 1.0
-->

<template>
    <div class="ss-card face-pan">
        <BcTab>
            <div icon="fa-solid fa-face-laugh-squint">
                <div class="system-face-bar">
                    <div class="title">
                        <span>{{ $t('超级表情') }}</span>
                    </div>
                    <div class="base-face">
                        <template v-for="num in Emoji.superList" :key="'base-face-wrapper-' + num">
                            <div>
                                <EmojiFace
                                    :key="'base-face-' + num"
                                    :emoji="Emoji.get(num)!"
                                    @click="addBaseFace(num)" />
                            </div>
                        </template>
                    </div>
                    <div class="title">
                        <span>{{ $t('小黄脸表情') }}</span>
                    </div>
                    <div class="base-face">
                        <template v-for="num in Emoji.normalList" :key="'base-face-wrapper-' + num">
                            <div>
                                <EmojiFace
                                    :key="'base-face-' + num"
                                    :emoji="Emoji.get(num)!"
                                    @click="addBaseFace(num)" />
                            </div>
                        </template>
                    </div>
                    <div class="title">
                        <span>{{ $t('emoji 表情') }}</span>
                    </div>
                    <div class="base-face">
                        <div v-for="num in Emoji.emojiList" :key="'base-face-wrapper-' + num">
                            <EmojiFace
                                :key="'base-face-' + num"
                                :emoji="Emoji.get(num)!"
                                @click="addBaseFace(num)" />
                        </div>
                    </div>
                </div>
            </div>
            <div icon="fa-solid fa-heart">
                <div class="title">
                    <span>{{ $t('收藏的表情') }}</span>
                    <font-awesome-icon
                        :icon="['fas', 'fa-rotate-right']"
                        @click="reloadRoamingStamp" />
                </div>
                <div class="face-stickers"
                    @scroll="stickersScroll">
                    <img v-for="(url, index) in runtimeData.stickerCache"
                        v-show="url != 'end'"
                        :key="'stickers-' + index"
                        loading="lazy"
                        :src="url"
                        @click="addImgFace(url)">
                    <div v-show="runtimeData.stickerCache && runtimeData.stickerCache.length <= 0"
                        class="ss-card">
                        <font-awesome-icon :icon="['fas', 'face-dizzy']" />
                        <span>{{ $t('一无所有') }}</span>
                    </div>
                </div>
            </div>
            <div v-if="backend.isDesktop()" icon="fa-solid fa-folder-open">
                <div class="title">
                    <span>{{ $t('本地表情') }}</span>
                    <font-awesome-icon
                        :icon="['fas', 'fa-folder-plus']"
                        :title="$t('选择文件夹')"
                        @click="selectLocalEmojiFolder" />
                    <font-awesome-icon
                        v-if="runtimeData.sysConfig.local_emoji_folder"
                        :icon="['fas', 'fa-rotate-right']"
                        :title="$t('重新加载')"
                        @click="reloadLocalEmojis" />
                </div>
                <div class="face-stickers">
                    <img v-for="(emoji, index) in localEmojis"
                        :key="'local-emoji-' + index"
                        loading="lazy"
                        :src="emoji.url"
                        :title="emoji.name"
                        @click="addLocalEmoji(emoji)">
                    <div v-show="!runtimeData.sysConfig.local_emoji_folder"
                        class="ss-card">
                        <font-awesome-icon :icon="['fas', 'folder-open']" />
                        <span>{{ $t('选择本地表情文件夹') }}</span>
                    </div>
                    <div v-show="runtimeData.sysConfig.local_emoji_folder && localEmojis.length <= 0"
                        class="ss-card">
                        <font-awesome-icon :icon="['fas', 'face-dizzy']" />
                        <span>{{ $t('暂无图片') }}</span>
                    </div>
                </div>
            </div>
        </BcTab>
    </div>
</template>

<script lang="ts">
    import {
        MsgItemElem,
        SQCodeElem,
    } from '@renderer/function/elements/information'
    import { defineComponent } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import { Connector } from '@renderer/function/connect'
    import { backend } from '@renderer/runtime/backend'
    import Option from '@renderer/function/option'
    import { PopInfo, PopType } from '@renderer/function/base'
    import BcTab from 'vue3-bcui/packages/bc-tab'
    import Emoji from '@renderer/function/model/emoji'
    import EmojiFace from './EmojiFace.vue'

    interface LocalEmoji {
        name: string
        path: string
        url: string
    }

    const popInfo = new PopInfo()

    export default defineComponent({
        name: 'FacePan',
        components: {
            BcTab,
            EmojiFace,
        },
        props: ['display'],
        emits: ['addSpecialMsg', 'sendMsg'],
        data() {
            return {
                Option: Option,
                runtimeData: runtimeData,
                baseFaceMax: 348,
                stickerPage: 1,
                Emoji,
                backend,
                localEmojis: [] as LocalEmoji[],
            }
        },
        mounted() {
            // 加载漫游表情
            if (
                runtimeData.stickerCache === undefined &&
                runtimeData.jsonMap.roaming_stamp
            ) {
                this.reloadRoamingStamp()
            }
            // 加载本地表情
            if (backend.isDesktop() && runtimeData.sysConfig.local_emoji_folder) {
                this.reloadLocalEmojis()
            }
        },
        methods: {
            reloadRoamingStamp() {
                runtimeData.stickerCache = undefined
                if (runtimeData.jsonMap.roaming_stamp.pagerType == 'full') {
                    // 全量分页，返回所有内容
                    Connector.send(
                        runtimeData.jsonMap.roaming_stamp.name,
                        { count: 48 },
                        'getRoamingStamp_48',
                    )
                } else {
                    // 默认不分页，返回所有内容
                    Connector.send(
                        runtimeData.jsonMap.roaming_stamp.name,
                        {},
                        'getRoamingStamp',
                    )
                }
            },

            addSpecialMsg(json: MsgItemElem, addText: boolean) {
                this.$emit('addSpecialMsg', {
                    addText: addText,
                    msgObj: json,
                } as SQCodeElem)
            },
            addBaseFace(id: number) {
                if (id < 5000)
                    this.addSpecialMsg({ type: 'face', id: id }, true)
                else
                    this.addSpecialMsg({ type: 'text', text: Emoji.get(id)!.value }, true)
            },
            addImgFace(url: string) {
                this.addSpecialMsg(
                    { type: 'image', file: url, subType: 1 },
                    true,
                )
                // 直接发送表情
                if(runtimeData.sysConfig.send_face == true) {
                    this.$emit('sendMsg')
                }
            },

            stickersScroll(e: Event) {
                const target = e.target as HTMLDivElement
                // 如果滚到了底部
                if (
                    target.scrollHeight - target.scrollTop <
                    target.clientHeight + 0.5
                ) {
                    if (runtimeData.stickerCache) {
                        if (runtimeData.jsonMap.roaming_stamp.pagerType == 'full' &&
                            runtimeData.stickerCache[runtimeData.stickerCache.length - 1] != 'end') {
                            const count = 48 + 48 * this.stickerPage
                            // 全量分页，返回所有内容（napcat 行为）
                            Connector.send(
                                runtimeData.jsonMap.roaming_stamp.name,
                                { count: count },
                                'getRoamingStamp_' + count,
                            )
                            this.stickerPage++
                        }
                    }
                }
            },

            // ========== 本地表情相关方法 ==========

            /**
             * 选择本地表情文件夹
             */
            async selectLocalEmojiFolder() {
                try {
                    const { $t } = this as any
                    // 调用后端选择文件夹
                    const folderPath = await backend.call(
                        undefined,
                        'sys:selectFolder',
                        true
                    )

                    if (folderPath) {
                        // 保存文件夹路径
                        Option.save('local_emoji_folder', folderPath)
                        popInfo.add(PopType.INFO, $t('已设置本地表情文件夹'))
                        // 重新加载本地表情
                        this.reloadLocalEmojis()
                    }
                } catch (error) {
                    const { $t } = this as any
                    popInfo.add(PopType.ERR, $t('选择文件夹失败'))
                }
            },

            /**
             * 重新加载本地表情
             */
            async reloadLocalEmojis() {
                try {
                    const folderPath = runtimeData.sysConfig.local_emoji_folder
                    if (!folderPath) {
                        this.localEmojis = []
                        return
                    }

                    // 调用后端读取文件夹中的图片
                    const images = await backend.call(
                        undefined,
                        'sys:getLocalEmojis',
                        true,
                        folderPath
                    )

                    if (images && Array.isArray(images)) {
                        // 对于 Tauri，需要使用 convertFileSrc 转换文件路径
                        if (backend.type === 'tauri') {
                            const { convertFileSrc } = await import('@tauri-apps/api/core')
                            this.localEmojis = images.map((img: any) => ({
                                name: img.name,
                                path: img.path,
                                url: convertFileSrc(img.path),
                            }))
                        } else {
                            this.localEmojis = images.map((img: any) => ({
                                name: img.name,
                                path: img.path,
                                url: img.url,
                            }))
                        }
                    } else {
                        this.localEmojis = []
                    }
                } catch (error) {
                    this.localEmojis = []
                }
            },

            /**
             * 添加本地表情到消息
             */
            async addLocalEmoji(emoji: LocalEmoji) {
                try {
                    // 读取文件为 base64
                    const base64String = await backend.call(
                        undefined,
                        'sys:readFileAsBase64',
                        true,
                        emoji.path
                    )

                    // 发送 base64 格式的图片
                    this.addSpecialMsg(
                        { type: 'image', file: 'base64://' + base64String, subType: 1 },
                        true,
                    )
                    // 如果设置了直接发送表情
                    if(runtimeData.sysConfig.send_face == true) {
                        this.$emit('sendMsg')
                    }
                } catch (error) {
                    const { $t } = this as any
                    popInfo.add(PopType.ERR, $t('添加本地表情失败'))
                }
            },
        },
    })
</script>
