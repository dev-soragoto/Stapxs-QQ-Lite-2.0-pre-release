<!--
 * @FileDescription: 群文件列表项模板
 * @Author: Stapxs
 * @Date: missing
 * @Version: 1.0
-->

<template>
    <div
        :class="
            (item.folder_id ? ' folder' : '') +
                (item.items && item.items.length > 0 ? ' open' : '')
        "
        @click="loadFileDir(item)">
        <font-awesome-icon v-if="item.folder_id" :icon="['fas', 'folder']" />
        <font-awesome-icon v-else :icon="['fas', 'file']" />
        <div class="main">
            <span>{{
                toHtml(item.folder_name ?? item.file_name)
            }}</span>
            <div>
                <span>{{
                    toHtml(item.creater_name ?? item.uploader_name)
                }}</span>
                <span>{{
                    (item.create_time || item.upload_time)
                        ? Intl.DateTimeFormat(trueLang, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        }).format(new Date((item.create_time ?? item.upload_time) * 1000))
                        : '-'
                }}</span>
                <span v-if="!item.dead_time && item.dead_time">{{
                    item.dead_time - item.create_time / 86400 - 1 + $t('天后')
                }}</span>
                <span v-if="item.folder_id">{{
                    $t('共 {num} 个文件', { num: item.count })
                }}</span>
                <span v-else>{{ getSize(item.size) }}</span>
            </div>
        </div>
        <template v-if="item.file_id">
            <div v-if="item.download_percent === undefined"
                class="download"
                @click="getFile(item)">
                <font-awesome-icon :icon="['fas', 'angle-down']" />
            </div>
            <svg
                v-else-if="item.download_percent !== undefined && item.download_percent < 100"
                class="download-bar"
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="50%" cy="50%" r="40%"
                    stroke-width="15%" fill="none" stroke-linecap="round" />
                <circle cx="50%" cy="50%" r="40%"
                    stroke-width="15%" fill="none"
                    :stroke-dasharray="
                        item.download_percent === undefined ? '0,10000' :
                        `${(Math.floor(2 * Math.PI * 25) * item.download_percent) / 100},10000` " />
            </svg>
            <div v-else class="download">
                <font-awesome-icon :icon="['fas', 'check']" />
            </div>
        </template>
        <div v-show="item.show_items !== false && item.items !== undefined"
            :class="(item.items !== undefined ? 'sub_file ' : '') + 'group-files'">
            <div
                v-for="sub_item in item.items"
                :key="'sub_file-' + sub_item.file_id">
                <FileBody
                    :chat="chat"
                    :item="(sub_item as GroupFileElem & GroupFileFolderElem)"
                    :parent="item.folder_id" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'

    import {
        getTrueLang,
        escape2Html,
        getSizeFromBytes,
    } from '@renderer/function/utils/systemUtil'
    import {
        GroupFileElem,
        GroupFileFolderElem
    } from '@renderer/function/elements/information'
    import { Connector } from '@renderer/function/connect'
    import { runtimeData } from '@renderer/function/msg'

    export default defineComponent({
        name: 'FileBody',
        props: {
            item: {
                type: Object as () => GroupFileElem & GroupFileFolderElem,
                required: true,
            },
            chat: {
                type: Object,
                required: true,
            },
            parent: {
                type: String,
                required: false,
                default: undefined,
            },
        },
        data() {
            return {
                trueLang: getTrueLang(),
                getSize: getSizeFromBytes,
                toHtml: escape2Html,
            }
        },
        methods: {
            /**
             * 下载文件（获取文件下载地址并下载）
             */
            getFile(item: GroupFileElem) {
                const name = runtimeData.jsonMap.file_download?.name
                if(name) {
                    Connector.send(
                        name,
                        {
                            group_id: runtimeData.chatInfo.show.id,
                            file_id: item.file_id,
                        },
                        'downloadGroupFile_' + item.file_id + '_' + btoa(unescape(encodeURIComponent(item.file_name))),
                    )
                    // PS：在发起下载后就要将百分比设置好 …… 因为下载部分不一定立刻会开始
                    // 这时候如果用户疑惑为什么点了没反应会多次操作的（用户竟是我自己）
                    item.download_percent = 0
                }
            },
            /**
             * 加载子文件夹
             */
            loadFileDir(item: GroupFileElem & GroupFileFolderElem) {
                const id = item.folder_id

                const name = runtimeData.jsonMap.group_folder_files?.name
                if(item.items !== undefined) {
                    item.show_items = !item.show_items
                    return
                }

                if (id && name) {
                    Connector.send(name, {
                        folder_id: id,
                        group_id: runtimeData.chatInfo.show.id,
                    }, 'getGroupDirFiles_' + id)
                }
            },
        },
    })
</script>
