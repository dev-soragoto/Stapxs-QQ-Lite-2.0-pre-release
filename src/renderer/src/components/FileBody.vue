<!--
 * @FileDescription: 群文件列表项模板
 * @Author: Stapxs
 * @Date: missing
 * @Version: 1.0
-->

<template>
    <div
        :class="
            (item.type === 2 ? ' folder' : '') +
                (item.sub_list && item.sub_list.length > 0 ? ' open' : '')
        "
        @click="loadFileDir(item.id, item.type)">
        <font-awesome-icon
            v-if="item.type === 2"
            :icon="['fas', 'folder']" />
        <font-awesome-icon
            v-if="item.type === 1"
            :icon="['fas', 'file']" />
        <div class="main">
            <span>{{ toHtml(item.name) }}</span>
            <div>
                <span :data-id="item.owner_uin">{{
                    toHtml(item.owner_name)
                }}</span>
                <span>{{
                    item.create_time === 0
                        ? '-'
                        : Intl.DateTimeFormat(trueLang, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        }).format(new Date(item.create_time * 1000))
                }}</span>
                <span v-if="!item.dead_time && item.dead_time">{{
                    item.dead_time - item.create_time / 86400 - 1 + $t('天后')
                }}</span>
                <span v-if="item.type === 2">{{
                    $t('共 {num} 个文件', { num: item.size })
                }}</span>
                <span v-if="item.type === 1">{{ getSize(item.size) }}</span>
            </div>
        </div>
        <div
            v-if="item.type === 1 && item.downloadingPercentage === undefined"
            class="download"
            @click="getFile(item)">
            <font-awesome-icon :icon="['fas', 'angle-down']" />
        </div>
        <svg
            v-if="item.downloadingPercentage !== undefined"
            class="download-bar"
            xmlns="http://www.w3.org/2000/svg">
            <circle
                cx="50%"
                cy="50%"
                r="40%"
                stroke-width="15%"
                fill="none"
                stroke-linecap="round" />
            <circle
                cx="50%"
                cy="50%"
                r="40%"
                stroke-width="15%"
                fill="none"
                :stroke-dasharray="
                    item.downloadingPercentage === undefined
                        ? '0,10000'
                        : `${(Math.floor(2 * Math.PI * 25) *
                            item.downloadingPercentage) / 100},10000`
                " />
        </svg>
        <div
            v-show="item.sub_item_show !== false && item.sub_list !== undefined"
            :class="
                (item.sub_list !== undefined ? 'sub_file ' : '') + 'group-files'
            ">
            <div
                v-for="sub_item in item.sub_list"
                :key="'sub_file-' + sub_item.id">
                <FileBody
                    :chat="chat"
                    :item="sub_item"
                    :parent="item.id" />
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
    import { Connector } from '@renderer/function/connect'
    import { runtimeData } from '@renderer/function/msg'

    export default defineComponent({
        name: 'FileBody',
        props: ['item', 'chat', 'parent'],
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
            getFile(item: { [key: string]: any }) {
                if (this.parent === undefined) {
                    Connector.send(
                        'get_file_url',
                        {
                            id: runtimeData.chatInfo.show.id,
                            message_id: runtimeData.messageList[0].message_id,
                            fid: item.id,
                        },
                        'downloadGroupFile_' + item.id,
                    )
                } else {
                    // 对于文件夹里的文件需要再找一次 ……
                    Connector.send(
                        'http_proxy',
                        {
                            id: runtimeData.chatInfo.show.id,
                            message_id: runtimeData.messageList[0].message_id,
                            fid: item.id,
                        },
                        'downloadGroupFile_' + this.parent + '_' + item.id,
                    )
                }
                // PS：在发起下载后就要将百分比设置好 …… 因为下载部分不一定立刻会开始
                // 这时候如果用户疑惑为什么点了没反应会多次操作的（用户竟是我自己）
                item.downloadingPercentage = 0
            },
            /**
             * 加载子文件夹
             */
            loadFileDir(id: string, type: number) {
                if (type === 2 && this.item.sub_list === undefined) {
                    // 加载群文件列表
                    const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=0&cnt=30&filter_code=0&folder_id=${id}&show_onlinedoc_folder=0`
                    Connector.send(
                        'http_proxy',
                        { url: url },
                        'getGroupDirFiles_' + id,
                    )
                }
            },
        },
    })
</script>
