<!--
 * @FileDescription: 消息模板
 * @Author: Stapxs
 * @Date:
 *      2022/08/03
 *      2022/12/12
 * @Version:
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
 -->

<template>
    <div
        :id="'chat-' + data.message_id"
        :class="
            'message' +
                (type ? ' ' + type : '') +
                (data.revoke ? ' revoke' : '') +
                (isMe ? ' me' : '') +
                (selected ? ' selected' : '')
        "
        :data-raw="getMsgRawTxt(data)"
        :data-sender="data.sender.user_id"
        :data-time="data.time"
        @mouseleave="hiddenUserInfo">
        <img
            v-show="!isMe || type == 'merge'"
            name="avatar"
            :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id"
            @dblclick="sendPoke">
        <div
            v-if="isMe && type != 'merge'"
            class="message-space" />
        <div
            :class="
                isMe
                    ? type == 'merge'
                        ? 'message-body'
                        : 'message-body me'
                    : 'message-body'
            ">
            <template
                v-if="
                    runtimeData.chatInfo.show.type == 'group' &&
                        !isMe &&
                        senderInfo?.title &&
                        senderInfo?.title != ''
                ">
                <span>{{ senderInfo?.title }}</span>
            </template>
            <a
                v-if="data.sender.card || data.sender.nickname"
                v-show="!isMe || type == 'merge'">
                {{ data.sender.card ? data.sender.card : data.sender.nickname }}
            </a>
            <a
                v-else
                v-show="!isMe || type == 'merge'">
                {{
                    isMe
                        ? runtimeData.loginInfo.nickname
                        : runtimeData.chatInfo.show.name
                }}
            </a>
            <div>
                <!-- 消息体 -->
                <template v-if="!hasCard()">
                    <div
                        v-for="(item, index) in data.message"
                        :key="data.message_id + '-m-' + index"
                        :class="View.isMsgInline(item.type) ? 'msg-inline' : ''">
                        <div v-if="item.type === undefined" />
                        <span
                            v-else-if="isDebugMsg"
                            class="msg-text">{{
                            item
                        }}</span>
                        <span
                            v-else-if="item.type == 'text'"
                            v-show="item.text !== ''"
                            class="msg-text"
                            @click="textClick"
                            v-html="parseText(item.text)" />
                        <img
                            v-else-if="
                                item.type == 'image' &&
                                    item.file == 'marketface'
                            "
                            :class="
                                imgStyle(
                                    data.message.length,
                                    index,
                                    item.asface,
                                ) + ' msg-mface'
                            "
                            :src="item.url"
                            @load="scrollButtom"
                            @error="imgLoadFail">
                        <img
                            v-else-if="item.type == 'image'"
                            :title="$t('预览图片')"
                            :alt="$t('图片')"
                            :class="
                                imgStyle(
                                    data.message.length,
                                    index,
                                    item.asface,
                                )
                            "
                            :src="item.url"
                            @load="scrollButtom"
                            @error="imgLoadFail"
                            @click="imgClick(data.message_id)">
                        <template v-else-if="item.type == 'face'">
                            <img
                                v-if="getFace(item.id)"
                                :alt="item.text"
                                class="msg-face"
                                :src="getFace(item.id)"
                                :title="item.text">
                            <span
                                v-else-if="item.id == 394"
                                class="msg-face-long"><span
                                v-for="i in 15"
                                :key="data.message_id + '-l-' + i">🐲</span></span>
                            <font-awesome-icon
                                v-else
                                :class="'msg-face-svg' + (isMe ? ' me' : '')"
                                :icon="['fas', 'face-grin-wide']" />
                        </template>
                        <span
                            v-else-if="item.type == 'bface'"
                            style="font-style: italic; opacity: 0.7">
                            [ {{ $t('图片') }}：{{ item.text }} ]
                        </span>
                        <div
                            v-else-if="item.type == 'at'"
                            :class="getAtClass(item.qq)">
                            <a
                                :data-id="item.qq"
                                :data-group="data.group_id"
                                @mouseenter="showUserInfo">{{ getAtName(item) }}</a>
                        </div>
                        <div
                            v-else-if="item.type == 'file'"
                            :class="'msg-file' + (isMe ? ' me' : '')">
                            <font-awesome-icon :icon="['fas', 'file']" />
                            <div>
                                <div>
                                    <p>
                                        {{
                                            loadFileBase(
                                                item,
                                                item.name,
                                                data.message_id,
                                            )
                                        }}
                                    </p>
                                    <a>（{{ getSizeFromBytes(item.size) }}）</a>
                                </div>
                                <i>{{ item.md5 }}</i>
                            </div>
                            <div>
                                <font-awesome-icon
                                    v-if="
                                        item.downloadingPercentage === undefined
                                    "
                                    :icon="['fas', 'angle-down']"
                                    @click="downloadFile(item, data.message_id)" />
                                <svg
                                    v-if="
                                        item.downloadingPercentage !== undefined
                                    "
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
                                            item.downloadingPercentage ===
                                                undefined
                                                ? '0,10000'
                                                : `${(Math.floor(2 * Math.PI * 25) *
                                                    item.downloadingPercentage) / 100},10000`
                                        " />
                                </svg>
                            </div>
                            <div
                                v-if="
                                    data.fileView &&
                                        Object.keys(data.fileView).length > 0
                                "
                                class="file-view">
                                <img
                                    v-if="
                                        [
                                            'jpg',
                                            'jpeg',
                                            'png',
                                            'gif',
                                            'bmp',
                                            'webp',
                                        ].includes(data.fileView.ext)
                                    "
                                    :src="data.fileView.url">
                                <video
                                    v-if="
                                        ['mp4', 'avi', 'mkv', 'flv'].includes(
                                            data.fileView.ext,
                                        )
                                    "
                                    playsinline
                                    controls
                                    muted
                                    autoplay>
                                    <source
                                        :src="data.fileView.url"
                                        :type="'video/' + data.fileView.ext">
                                    现在还有不支持 video tag 的浏览器吗？
                                </video>
                                <span
                                    v-if="
                                        ['txt', 'md'].includes(
                                            data.fileView.ext,
                                        ) && item.size < 2000000
                                    "
                                    class="txt">
                                    <a>&gt; {{ item.name }} -
                                        {{ $t('文件预览') }}</a>
                                    {{
                                        getTxtUrl(
                                            data.fileView.url,
                                            data.message_id,
                                        )
                                    }}{{ data.fileView.txt }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-else-if="item.type == 'video'"
                            class="msg-video">
                            <video
                                playsinline
                                controls
                                muted
                                autoplay>
                                <source
                                    :src="item.url"
                                    type="video/mp4">
                                现在还有不支持 video tag 的浏览器吗？
                            </video>
                        </div>
                        <span
                            v-else-if="item.type == 'forward'"
                            class="msg-unknown"
                            style="cursor: pointer"
                            @click="View.getForwardMsg(item.id)">
                            {{ $t('（点击查看合并转发消息）') }}
                        </span>
                        <div
                            v-else-if="item.type == 'reply'"
                            :class="
                                isMe
                                    ? type == 'merge'
                                        ? 'msg-replay'
                                        : 'msg-replay me'
                                    : 'msg-replay'
                            "
                            @click="scrollToMsg(item.id)">
                            <font-awesome-icon :icon="['fas', 'reply']" />
                            <a
                                :class="getRepMsg(item.id) ? '' : 'msg-unknown'"
                                style="cursor: pointer">
                                {{
                                    getRepMsg(item.id) ?? $t('（查看回复消息）')
                                }}
                            </a>
                        </div>

                        <span
                            v-else
                            class="msg-unknown">{{
                            '( ' + $t('不支持的消息') + ': ' + item.type + ' )'
                        }}</span>
                    </div>
                </template>
                <template v-else>
                    <template
                        v-for="(item, index) in data.message"
                        :key="data.message_id + '-m-' + index">
                        <CardMessage
                            v-if="item.type == 'xml' || item.type == 'json'"
                            :id="data.message_id"
                            :item="item" />
                    </template>
                </template>
                <!-- 链接预览框 -->
                <div
                    v-if="
                        pageViewInfo !== undefined &&
                            Object.keys(pageViewInfo).length > 0
                    "
                    :class="'msg-link-view ' + linkViewStyle">
                    <div :class="'bar' + (isMe ? ' me' : '')" />
                    <div>
                        <img
                            v-if="pageViewInfo.img !== undefined"
                            :id="data.message_id + '-linkview-img'"
                            alt="预览图片"
                            title="查看图片"
                            :src="pageViewInfo.img"
                            @load="linkViewPicFin">
                        <div class="body">
                            <p>{{ pageViewInfo.site }}</p>
                            <span :href="pageViewInfo.url">{{
                                pageViewInfo.title
                            }}</span>
                            <span>{{ pageViewInfo.desc }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="data.fake_msg == true"
            class="sending">
            <font-awesome-icon :icon="['fas', 'spinner']" />
        </div>
        <div
            v-if="data.emoji_like"
            :class="'emoji-like' + (isMe ? ' me' : '')">
            <div class="emoji-like-body">
                <div
                    v-for="info in data.emoji_like"
                    v-show="getFace(info.emoji_id) != ''"
                    :key="'respond-' + data.message_id + '-' + info.emoji_id">
                    <img
                        loading="lazy"
                        :src="getFace(info.emoji_id) as any">
                    <span>{{ info.count }}</span>
                </div>
            </div>
        </div>
        <code style="display: none">{{ data.raw_message }}</code>
    </div>
</template>

<script lang="ts">
    import Option from '@renderer/function/option'
    import CardMessage from './msg-component/CardMessage.vue'
    import app from '@renderer/main'

    import { MsgBodyFuns as ViewFuns } from '@renderer/function/model/msg-body'
    import { defineComponent } from 'vue'
    import { Connector } from '@renderer/function/connect'
    import { runtimeData } from '@renderer/function/msg'
    import { Logger, PopInfo, PopType } from '@renderer/function/base'
    import { StringifyOptions } from 'querystring'
    import { getFace, getMsgRawTxt } from '@renderer/function/utils/msgUtil'
    import {
        openLink,
        downloadFile,
        sendStatEvent,
    } from '@renderer/function/utils/appUtil'
    import { getSizeFromBytes } from '@renderer/function/utils/systemUtil'

    export default defineComponent({
        name: 'MsgBody',
        components: { CardMessage },
        props: ['data', 'type', 'selected'],
        emits: ['scrollToMsg', 'scrollButtom', 'sendPoke'],
        data() {
            return {
                getFace: getFace,
                getSizeFromBytes: getSizeFromBytes,
                isMe: false,
                isDebugMsg: Option.get('debug_msg'),
                linkViewStyle: '',
                View: ViewFuns,
                runtimeData: runtimeData,
                pageViewInfo: undefined as { [key: string]: any } | undefined,
                gotLink: false,
                getVideo: false,
                senderInfo: null as any,
            }
        },
        mounted() {
            // 初始化 isMe 参数
            this.isMe =
                Number(runtimeData.loginInfo.uin) ===
                Number(this.data.sender.user_id)
            // 补充发送者信息
            this.$watch(
                () => runtimeData.chatInfo.info.group_members.length,
                () => {
                    this.senderInfo =
                        runtimeData.chatInfo.info.group_members.filter(
                            (item: any) => {
                                return item.user_id == this.data.sender.user_id
                            },
                        )[0]
                },
            )
            this.senderInfo = runtimeData.chatInfo.info.group_members.filter(
                (item: any) => {
                    return item.user_id == this.data.sender.user_id
                },
            )[0]
        },
        methods: {
            /**
             * 获取消息的纯文本（此方法可能会被遗弃）
             * @param message 消息对象
             */
            getMsgRawTxt(message: any) {
                return getMsgRawTxt(message)
            },

            /**
             * 根据消息状态获取 At 消息实际的 CSS class
             * @param who
             */
            getAtClass(who: number | string) {
                let back = 'msg-at'
                if (this.isMe && this.type != 'merge') {
                    back += ' me'
                }
                if (runtimeData.loginInfo.uin == who || who == 'all') {
                    back += ' atme'
                }
                return back
            },

            /**
             * 在 At 消息返回内容没有名字的时候尝试在群成员列表内寻找
             * @param item
             */
            getAtName(item: { [key: string]: any }) {
                if (item.qq == 'all') {
                    return '@' + this.$t('全体成员')
                }
                if (item.text != undefined) {
                    return item.text
                } else {
                    for (
                        let i = 0;
                        i < runtimeData.chatInfo.info.group_members.length;
                        i++
                    ) {
                        const user = runtimeData.chatInfo.info.group_members[i]
                        if (user.user_id == Number(item.qq)) {
                            return (
                                '@' +
                                (user.card != '' && user.card != null? user.card: user.nickname)
                            )
                        }
                    }
                    return '@' + item.qq
                }
            },

            /**
             * 滚动到指定消息
             * @param id 消息 id
             */
            scrollToMsg(id: string) {
                this.$emit('scrollToMsg', 'chat-' + id)
            },

            /**
             * 处理图片显示需要的样式，顺便添加图片列表
             * @param length 消息段数
             * @param at 图片在消息中的位置
             */
            imgStyle(length: number, at: number, isFace: boolean) {
                let style = 'msg-img'
                // 处理样式
                if (isFace) {
                    style += ' face'
                }
                if (length === 1) {
                    return (style += ' alone')
                }
                if (at === 0) {
                    return (style += ' top')
                }
                if (at === length - 1) {
                    return (style += ' button')
                }
                return style
            },

            /**
             * 图片点击
             * @param msgId 消息 ID
             */
            imgClick(msgId: string) {
                if (runtimeData.chatInfo.info.image_list !== undefined) {
                    // 寻找实际的序号
                    let num = -1
                    for (
                        let i = 0;
                        i < runtimeData.chatInfo.info.image_list.length;
                        i++
                    ) {
                        const item = runtimeData.chatInfo.info.image_list[i]
                        if (item.message_id == msgId) {
                            num = i
                            break
                        }
                    }
                    // 显示
                    const viewer = app.config.globalProperties.$viewer
                    if (num >= 0 && viewer) {
                        viewer.view(num)
                        viewer.show()
                        runtimeData.tags.viewer.index = num
                    } else {
                        new PopInfo().add(PopType.INFO, this.$t('定位图片失败'))
                    }
                }
            },

            /**
             * 图片加载完成，滚到底部
             */
            scrollButtom() {
                this.$emit('scrollButtom', null)
            },

            /**
             * 图片加载失败
             */
            imgLoadFail(event: Event) {
                const sender = event.currentTarget as HTMLImageElement
                const parent = sender.parentNode as HTMLDivElement
                parent.style.display = 'flex'
                parent.style.flexDirection = 'column'
                parent.style.alignItems = 'center'
                parent.style.padding = '20px 50px'
                parent.style.border = '2px dashed var(--color-card-2)'
                parent.style.borderRadius = '10px'
                parent.style.margin = '10px 0'
                parent.innerText = ''
                // 新建 svg
                const svg = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'svg',
                )
                svg.setAttribute('viewBox', '0 0 512 512')
                svg.innerHTML =
                    '<path d="M119.4 44.1c23.3-3.9 46.8-1.9 68.6 5.3l49.8 77.5-75.4 75.4c-1.5 1.5-2.4 3.6-2.3 5.8s1 4.2 2.6 5.7l112 104c2.9 2.7 7.4 2.9 10.5 .3s3.8-7 1.7-10.4l-60.4-98.1 90.7-75.6c2.6-2.1 3.5-5.7 2.4-8.8L296.8 61.8c28.5-16.7 62.4-23.2 95.7-17.6C461.5 55.6 512 115.2 512 185.1v5.8c0 41.5-17.2 81.2-47.6 109.5L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9L47.6 300.4C17.2 272.1 0 232.4 0 190.9v-5.8c0-69.9 50.5-129.5 119.4-141z"/>'
                svg.style.width = '40px'
                svg.style.opacity = '0.8'
                svg.style.fill = 'var(--color-main)'
                if (this.isMe) {
                    svg.style.fill = 'var(--color-font-r)'
                }
                parent.appendChild(svg)
                // 新建 span
                const span = document.createElement('span')
                span.innerText = this.$t('加载图片失败')
                span.style.marginTop = '10px'
                span.style.fontSize = '0.8rem'
                span.style.color = 'var(--color-font-2)'
                if (this.isMe) {
                    span.style.color = 'var(--color-font-1-r)'
                }
                parent.appendChild(span)
                // 链接
                const a = document.createElement('a')
                a.innerText = this.$t('预览图片')
                a.target = '__blank'
                a.href = sender.src
                a.style.marginTop = '10px'
                a.style.fontSize = '0.7rem'
                a.style.color = 'var(--color-font-2)'
                if (this.isMe) {
                    a.style.color = 'var(--color-font-1-r)'
                }
                parent.appendChild(a)
            },

            /**
             * 处理纯文本消息和链接预览
             * @param text 纯文本消息
             */
            parseText(text: string) {
                const logger = new Logger()
                text = ViewFuns.parseText(text)
                // 链接判定
                const reg =
                    /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/gi
                text = text.replaceAll(
                    reg,
                    '<a href="" data-link="$&" onclick="return false">$&</a>',
                )
                const linkList = text.match(reg)
                if (linkList !== null && !this.gotLink) {
                    this.gotLink = true
                    const fistLink = linkList[0]
                    // 获取链接预览
                    fetch(
                        import.meta.env.VITE_APP_LINK_VIEW +
                            encodeURIComponent(fistLink),
                    )
                        .then((res) => res.json())
                        .then((res) => {
                            if (
                                res.status === undefined &&
                                Object.keys(res).length > 0
                            ) {
                                logger.debug(
                                    '获取链接预览成功: ' + res['og:title'],
                                )
                                const pageData = {
                                    site:
                                        res['og:site_name'] === undefined? '': res['og:site_name'],
                                    title:
                                        res['og:title'] === undefined? '': res['og:title'],
                                    desc:
                                        res['og:description'] === undefined? '': res['og:description'],
                                    img: res['og:image'],
                                    link: res['og:url'],
                                }
                                this.pageViewInfo = pageData
                            }
                            const reg1 = /\/\/(.*?)\//g
                            const getDom = fistLink.match(reg1)
                            if (getDom !== null) {
                                sendStatEvent('link_view', {
                                    domain: RegExp.$1,
                                    statue: true,
                                })
                            } else {
                                sendStatEvent('link_view', {
                                    domain: '',
                                    statue: true,
                                })
                            }
                        })
                        .catch((error) => {
                            if (error) {
                                logger.error(
                                    error as Error,
                                    '获取链接预览失败: ' + fistLink,
                                )
                                const reg1 = /\/\/(.*?)\//g
                                const getDom = fistLink.match(reg1)
                                if (getDom !== null) {
                                    sendStatEvent('link_view', {
                                        domain: RegExp.$1,
                                        statue: false,
                                    })
                                } else {
                                    sendStatEvent('link_view', {
                                        domain: '',
                                        statue: false,
                                    })
                                }
                            }
                        })
                }
                // 返回
                return text
            },

            /**
             * 对链接预览的图片长宽进行判定以确定显示样式
             */
            linkViewPicFin() {
                const img = document.getElementById(
                    this.data.message_id + '-linkview-img',
                ) as HTMLImageElement
                if (img !== null) {
                    const w = img.naturalWidth
                    const h = img.naturalHeight
                    if (w > h) {
                        this.linkViewStyle = 'large'
                    }
                }
            },

            /**
             * 当鼠标悬停在 at 消息上时显示被 at 人的消息悬浮窗
             * @param event 消息事件
             */
            showUserInfo(event: Event) {
                const sender = event.currentTarget as HTMLDivElement
                const id = sender.dataset.id
                const group = sender.dataset.group
                // 获取鼠标位置
                const pointEvent =
                    (event as MouseEvent) || (window.event as MouseEvent)
                const pointX = pointEvent.offsetX
                const pointY = pointEvent.clientY
                // TODO: 出界判定不做了怪麻烦的
                // 请求用户信息
                Connector.send(
                    'get_group_member_info',
                    { group_id: group, user_id: id },
                    'getGroupMemberInfo_' + pointX + '_' + pointY,
                )
            },

            /**
             * 隐藏 At 信息面板
             */
            hiddenUserInfo() {
                if (runtimeData.chatInfo.info.now_member_info !== undefined) {
                    runtimeData.chatInfo.info.now_member_info = undefined
                }
            },

            /**
             * 尝试在消息列表中寻找这条被回复的消息，获取消息内容
             * @param message_id
             */
            getRepMsg(message_id: string) {
                const list = this.runtimeData.messageList.filter((item) => {
                    return item.message_id == message_id
                })
                if (list.length === 1) {
                    if (list[0].message.length > 0)
                        return (
                            list[0].sender.nickname +
                            ': ' +
                            getMsgRawTxt(list[0])
                        )
                    else return this.$t('（获取回复消息失败）')
                }
                return null
            },

            /**
             * 下载消息中的文件
             * @param data 消息对象
             */
            downloadFile(data: any, message_id: string) {
                const onProcess = function (event: ProgressEvent): undefined {
                    if (!event.lengthComputable) return
                    data.downloadingPercentage = Math.floor(
                        (event.loaded / event.total) * 100,
                    )
                }
                if (data.url) {
                    // 消息中有文件链接的话就不用获取了 ……
                    downloadFile(data.url, data.name, onProcess)
                } else {
                    // 获取下载链接
                    Connector.send(
                        'get_file_url',
                        {
                            id: runtimeData.chatInfo.show.id,
                            message_id: message_id,
                            fid: data.fid,
                        },
                        'downloadFile_' + message_id + '_' + data.name,
                    )
                }
            },

            /**
             * 文本消息被点击
             * @param event 事件
             */
            textClick(event: Event) {
                const target = event.target as HTMLElement
                if (target.dataset.link) {
                    // 点击了链接
                    const link = target.dataset.link
                    openLink(link)
                }
            },

            /**
             * 对部分文件类型进行预览处理
             * @param name 文件名
             */
            loadFileBase(
                data: any,
                name: string,
                message_id: StringifyOptions,
            ) {
                const ext = name.split('.').pop()
                // 寻找消息位置
                let msgIndex = -1
                runtimeData.messageList.forEach((item, index) => {
                    if (item.message_id === message_id) {
                        msgIndex = index
                    }
                })
                if (
                    ext &&
                    runtimeData.messageList[msgIndex].fileView == undefined
                ) {
                    // 图片、视频和文本文件获取文件链接
                    const list = [
                        'jpg',
                        'jpeg',
                        'png',
                        'gif',
                        'bmp',
                        'webp',
                        'mp4',
                        'avi',
                        'mkv',
                        'flv',
                        'txt',
                        'md',
                    ]
                    if (list.includes(ext)) {
                        runtimeData.messageList[msgIndex].fileView = {}
                        if (data.url) {
                            if (msgIndex !== -1) {
                                runtimeData.messageList[msgIndex].fileView.url =
                                    data.url
                                runtimeData.messageList[msgIndex].fileView.ext =
                                    ext
                            }
                        } else {
                            // 获取下载链接
                            Connector.send(
                                'get_file_url',
                                {
                                    id: runtimeData.chatInfo.show.id,
                                    message_id: message_id,
                                    fid: data.fid,
                                },
                                'loadFileBase_' +
                                    this.data.message_id +
                                    '_' +
                                    ext,
                            )
                        }
                    }
                }
                return name
            },

            /**
             * 下载 txt 文件并获取文件内容
             * @param url 链接
             */
            getTxtUrl(url: string, id: string) {
                // 寻找消息位置
                let msgIndex = -1
                runtimeData.messageList.forEach((item, index) => {
                    if (item.message_id === id) {
                        msgIndex = index
                    }
                })
                // 保存文件为 Blob
                fetch(url)
                    .then((r) => r.blob())
                    .then((blob) => {
                        if (msgIndex !== -1) {
                            // 读取文件内容并返回文本
                            const reader = new FileReader()
                            reader.readAsText(blob, 'utf-8')
                            reader.onload = function () {
                                // 只取前 300 字，超出部分加上 ……
                                const txt = reader.result as string
                                runtimeData.messageList[msgIndex].fileView.txt =
                                    txt.length > 300? txt.slice(0, 300) + '…': txt
                            }
                        }
                    })
            },

            hasCard() {
                let hasCard = false
                this.data.message.forEach((item: any) => {
                    if (item.type === 'json' || item.type === 'xml') {
                        hasCard = true
                    }
                })
                return hasCard
            },

            sendPoke() {
                // 调用上级组件的 poke 方法
                this.$emit('sendPoke', this.data.sender.user_id)
            },
        },
    })
</script>
<style>
    .emoji-like {
        flex-direction: row;
        display: flex;
        width: 100%;
    }
    .emoji-like-body {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        max-width: 30%;
        margin-left: 50px;
        margin-top: 10px;
    }
    .emoji-like-body div {
        background: var(--color-card-1);
        border-radius: 7px;
        margin-right: 5px;
        padding: 5px 15px;
        margin-bottom: 5px;
    }
    .emoji-like-body img {
        width: 15px;
        height: 15px;
    }
    .emoji-like-body span {
        color: var(--color-font-2);
        margin-left: 10px;
        font-size: 0.8rem;
    }

    @media (min-width: 992px) {
        .emoji-like.me {
            flex-direction: row-reverse;
        }
        .emoji-like.me > div.emoji-like-body {
            flex-direction: row-reverse;
            margin-right: -5px;
        }
    }
</style>
