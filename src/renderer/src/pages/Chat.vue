<!--
 * @FileDescription: 聊天面板页面
 * @Author: Stapxs
 * @Date:
 *      2022/08/14
 *      2022/12/12
 * @Version:
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
-->

<template>
    <div
        id="chat-pan"
        :class="
            'chat-pan' +
                (runtimeData.tags.openSideBar ? ' open' : '') +
                (runtimeData.sysConfig.opt_no_window ? ' withBar' : '')
        "
        :style="`background-image: url(${runtimeData.sysConfig.chat_background});`"
        @touchmove="ChatOnMove"
        @touchend="chatMoveEnd">
        <!-- 聊天基本信息 -->
        <div class="info">
            <font-awesome-icon
                :icon="['fas', 'bars-staggered']"
                @click="openLeftBar" /><img :src="chat.show.avatar">
            <div class="info">
                <p>
                    {{ chat.show.name
                    }}<template
                        v-if="runtimeData.chatInfo.show.type == 'group'">
                        ({{
                            runtimeData.chatInfo.info.group_members.length
                        }})
                    </template>
                </p>
                <span v-if="chat.show.temp">
                    {{ $t('来自群聊：{group}', { group: chat.show.temp }) }}
                </span>
                <span v-else>
                    {{
                        list[list.length - 1]
                            ? $t('上次消息 - {time}', {
                                time: Intl.DateTimeFormat(trueLang, {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    second: 'numeric',
                                }).format(
                                    new Date(
                                        list[list.length - 1].time * 1000,
                                    ),
                                ),
                            })
                            : $t('暂无消息')
                    }}
                </span>
            </div>
            <div class="space" />
            <div class="more">
                <font-awesome-icon
                    :icon="['fas', 'ellipsis-vertical']"
                    @click="openChatInfoPan" />
            </div>
        </div>
        <!-- 加载中指示器 -->
        <div
            :class="
                'loading' +
                    (tags.nowGetHistroy && runtimeData.tags.canLoadHistory
                        ? ' show'
                        : '')
            ">
            <font-awesome-icon :icon="['fas', 'spinner']" />
            <span>{{ $t('加载中') }}</span>
        </div>
        <!-- 消息显示区 -->
        <div
            v-if="!details[3].open"
            id="msgPan"
            class="chat"
            style="scroll-behavior: smooth"
            @scroll="chatScroll">
            <div
                v-if="!runtimeData.tags.canLoadHistory"
                class="note note-nomsg">
                <hr>
                <a>{{ $t('没有更多消息了') }}</a>
            </div>
            <!-- 时间戳，在下滑加载的时候会显示，方便在大段的相连消息上让用户知道消息时间 -->
            <NoticeBody
                v-if="tags.nowGetHistroy && list.length > 0"
                :data="{ sub_type: 'time', time: list[0].time }" />
            <TransitionGroup
                :name="runtimeData.sysConfig.opt_fast_animation ? '' : 'msglist'"
                tag="div">
                <template v-for="(msgIndex, index) in list">
                    <!-- 时间戳 -->
                    <NoticeBody
                        v-if="
                            isShowTime(
                                list[index - 1]
                                    ? list[index - 1].time
                                    : undefined,
                                msgIndex.time,
                            )
                        "
                        :key="'notice-time-' + index"
                        :data="{ sub_type: 'time', time: msgIndex.time }" />
                    <!-- 消息体 -->
                    <MsgBody
                        v-if="
                            (msgIndex.post_type === 'message' ||
                                msgIndex.post_type === 'message_sent') &&
                                msgIndex.message.length > 0
                        "
                        :key="msgIndex.message_id"
                        :selected="
                            multipleSelectList.includes(msgIndex.message_id) ||
                                tags.openedMenuMsg?.id == 'chat-' + msgIndex.message_id
                        "
                        :data="msgIndex"
                        @click="msgClick($event, msgIndex)"
                        @scroll-to-msg="scrollToMsg"
                        @scroll-buttom="imgLoadedScroll"
                        @contextmenu.prevent="showMsgMeun($event, msgIndex)"
                        @touchstart="msgStartMove($event, msgIndex)"
                        @touchmove="msgOnMove"
                        @touchend="msgMoveEnd($event, msgIndex)"
                        @send-poke="sendPoke" />
                    <!-- 其他通知消息 -->
                    <NoticeBody
                        v-if="msgIndex.post_type === 'notice'"
                        :id="uuid()"
                        :key="'notice-' + index"
                        :data="msgIndex" />
                </template>
            </TransitionGroup>
        </div>
        <div
            v-else
            id="msgPan"
            class="chat"
            style="scroll-behavior: smooth">
            <!-- 搜索消息结果显示 -->
            <TransitionGroup
                :name="runtimeData.sysConfig.opt_fast_animation ? '' : 'msglist'"
                tag="div">
                <template v-for="(msgIndex, index) in tags.search.list">
                    <!-- 时间戳 -->
                    <NoticeBody
                        v-if="
                            isShowTime(
                                list[index - 1]
                                    ? list[index - 1].time
                                    : undefined,
                                msgIndex.time,
                            )
                        "
                        :key="'notice-time-' + index"
                        :data="{ sub_type: 'time', time: msgIndex.time }" />
                    <!-- 消息体 -->
                    <MsgBody
                        v-if="
                            (msgIndex.post_type === 'message' ||
                                msgIndex.post_type === 'message_sent') &&
                                msgIndex.message.length > 0
                        "
                        :key="msgIndex.message_id"
                        :selected="
                            multipleSelectList.includes(msgIndex.message_id) ||
                                tags.openedMenuMsg?.id == 'chat-' + msgIndex.message_id
                        "
                        :data="msgIndex"
                        @scroll-to-msg="scrollToMsg"
                        @scroll-buttom="imgLoadedScroll"
                        @contextmenu.prevent="showMsgMeun($event, msgIndex)"
                        @touchstart="msgStartMove($event, msgIndex)"
                        @touchmove="msgOnMove"
                        @touchend="msgMoveEnd($event, msgIndex)" />
                    <!-- 其他通知消息 -->
                    <NoticeBody
                        v-if="msgIndex.post_type === 'notice'"
                        :id="uuid()"
                        :key="'notice-' + index"
                        :data="msgIndex" />
                </template>
            </TransitionGroup>
        </div>
        <!-- 滚动到底部悬浮标志 -->
        <div
            v-show="tags.showBottomButton"
            class="new-msg"
            @click="scrollBottom(true)">
            <div class="ss-card">
                <font-awesome-icon :icon="['fas', 'comment']" />
                <span v-if="NewMsgNum > 0">{{ NewMsgNum }}</span>
            </div>
        </div>
        <!-- 底部区域 -->
        <div
            id="send-more"
            class="more">
            <!-- 功能附加 -->
            <div>
                <div>
                    <!-- 表情面板 -->
                    <Transition name="pan">
                        <FacePan
                            v-show="details[1].open"
                            @add-special-msg="addSpecialMsg" />
                    </Transition>
                    <!-- 精华消息 -->
                    <Transition name="pan">
                        <div
                            v-show="
                                details[2].open &&
                                    runtimeData.chatInfo.info.jin_info.list.length >
                                    0
                            "
                            class="ss-card jin-pan">
                            <div>
                                <font-awesome-icon :icon="['fas', 'message']" />
                                <span>{{ $t('精华消息') }}</span>
                                <font-awesome-icon
                                    :icon="['fas', 'xmark']"
                                    @click="details[2].open = !details[2].open" />
                            </div>
                            <div
                                class="jin-pan-body"
                                @scroll="jinScroll">
                                <div
                                    v-for="(item, index) in runtimeData.chatInfo
                                        .info.jin_info.list"
                                    :key="'jin-' + index">
                                    <div>
                                        <img
                                            :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.sender_uin}`">
                                        <div>
                                            <a>{{ item.sender_nick }}</a>
                                            <span>{{
                                                      Intl.DateTimeFormat(
                                                          trueLang,
                                                          {
                                                              hour: 'numeric',
                                                              minute: 'numeric',
                                                          },
                                                      ).format(
                                                          new Date(
                                                              item.sender_time *
                                                                  1000,
                                                          ),
                                                      )
                                                  }}
                                                {{ $t('发送') }}</span>
                                        </div>
                                        <span>{{
                                            $t('{time}，由 {name} 设置', {
                                                time: Intl.DateTimeFormat(
                                                    trueLang,
                                                    {
                                                        hour: 'numeric',
                                                        minute: 'numeric',
                                                    },
                                                ).format(
                                                    new Date(
                                                        item.add_digest_time *
                                                            1000,
                                                    ),
                                                ),
                                                name: item.add_digest_nick,
                                            })
                                        }}</span>
                                    </div>
                                    <div class="context">
                                        <template
                                            v-for="(
                                                context, indexc
                                            ) in item.msg_content"
                                            :key="
                                                'jinc-' + index + '-' + indexc
                                            ">
                                            <span
                                                v-if="context.msg_type === 1">{{ context.text }}</span>
                                            <img
                                                v-if="context.msg_type === 2"
                                                class="face"
                                                :src="getFace(context.face_index)">
                                            <img
                                                v-if="context.msg_type === 3"
                                                :src="context.image_url">
                                        </template>
                                    </div>
                                </div>
                                <div
                                    v-show="tags.isJinLoading"
                                    class="jin-pan-load">
                                    <font-awesome-icon
                                        :icon="['fas', 'spinner']" />
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
                <!-- 多选指示器 -->
                <div
                    :class="
                        multipleSelectList.length > 0
                            ? 'select-tag show'
                            : 'select-tag'
                    ">
                    <div>
                        <font-awesome-icon
                            :icon="['fas', 'share']"
                            @click="showForWard" />
                        <span>{{ $t('合并转发') }}</span>
                    </div>
                    <div>
                        <font-awesome-icon :icon="['fas', 'scissors']" />
                        <span>{{ $t('截图') }}</span>
                    </div>
                    <div>
                        <font-awesome-icon
                            :icon="['fas', 'trash-can']"
                            @click="delMsgs" />
                        <span>{{ $t('删除') }}</span>
                    </div>
                    <div>
                        <font-awesome-icon
                            :icon="['fas', 'copy']"
                            @click="copyMsgs" />
                        <span>{{ $t('复制') }}</span>
                    </div>
                    <div>
                        <span @click="multipleSelectList = []">{{
                            multipleSelectList.length
                        }}</span>
                        <span>{{ $t('取消') }}</span>
                    </div>
                </div>
                <!-- 搜索指示器 -->
                <div
                    :class="details[3].open ? 'search-tag show' : 'search-tag'">
                    <font-awesome-icon :icon="['fas', 'search']" />
                    <span>{{ $t('搜索已加载的消息') }}</span>
                    <div @click="closeSearch">
                        <font-awesome-icon :icon="['fas', 'xmark']" />
                    </div>
                </div>
                <!-- 回复指示器 -->
                <div :class="tags.isReply ? 'replay-tag show' : 'replay-tag'">
                    <font-awesome-icon :icon="['fas', 'reply']" />
                    <span>{{
                        selectedMsg === null
                            ? ''
                            : selectedMsg.sender.nickname +
                                ': ' +
                                fun.getMsgRawTxt(selectedMsg)
                    }}</span>
                    <div @click="cancelReply">
                        <font-awesome-icon :icon="['fas', 'xmark']" />
                    </div>
                </div>
                <!-- At 指示器 -->
                <div
                    :class="atFindList != null ? 'at-tag show' : 'at-tag'"
                    contenteditable="true"
                    @blur="choiceAt(undefined)">
                    <div
                        v-for="item in atFindList != null ? atFindList : []"
                        :key="'atFind-' + item.user_id"
                        @click="choiceAt(item.user_id)">
                        <img
                            :src="
                                'https://q1.qlogo.cn/g?b=qq&s=0&nk=' +
                                    item.user_id
                            ">
                        <span>{{
                            item.card != '' && item.card != null
                                ? item.card
                                : item.nickname
                        }}</span>
                        <a>{{ item.user_id }}</a>
                    </div>
                    <div
                        v-if="atFindList?.length == 0"
                        class="emp">
                        <span>{{ $t('没有找到匹配的群成员') }}</span>
                    </div>
                </div>
                <!-- 更多功能 -->
                <div
                    :class="
                        tags.showMoreDetail ? 'more-detail show' : 'more-detail'
                    ">
                    <div
                        :title="$t('图片')"
                        @click="runSelectImg">
                        <font-awesome-icon :icon="['fas', 'image']" />
                        <input
                            id="choice-pic"
                            type="file"
                            style="display: none"
                            @change="selectImg">
                    </div>
                    <div
                        :title="$t('文件')"
                        @click="runSelectFile">
                        <font-awesome-icon :icon="['fas', 'folder']" />
                        <input
                            id="choice-file"
                            type="file"
                            style="display: none"
                            @change="selectFile">
                    </div>
                    <div
                        :title="$t('表情')"
                        @click="
                            (details[1].open = !details[1].open),
                            (tags.showMoreDetail = false)
                        ">
                        <font-awesome-icon :icon="['fas', 'face-laugh']" />
                    </div>
                    <div
                        v-if="chat.show.type === 'user'"
                        :title="$t('戳一戳')"
                        @click="sendPoke(chat.show.id)">
                        <font-awesome-icon
                            :icon="['fas', 'fa-hand-point-up']" />
                    </div>
                    <div
                        v-if="chat.show.type === 'group'"
                        :title="$t('精华消息')"
                        @click="showJin">
                        <font-awesome-icon :icon="['fas', 'star']" />
                    </div>
                    <div class="space" />
                    <div
                        :title="$t('搜索消息')"
                        @click="openSearch">
                        <font-awesome-icon :icon="['fas', 'search']" />
                    </div>
                </div>
            </div>
            <!-- 消息发送框 -->
            <div>
                <div @click="moreFunClick">
                    <font-awesome-icon :icon="['fas', 'plus']" />
                </div>
                <div>
                    <form @submit.prevent="mainSubmit">
                        <input
                            v-if="!Option.get('use_breakline')"
                            id="main-input"
                            v-model="msg"
                            type="text"
                            autocomplete="off"
                            :disabled="
                                runtimeData.tags.openSideBar ||
                                    chat.info.me_info.shut_up_timestamp > 0
                            "
                            :placeholder="
                                chat.info.me_info.shut_up_timestamp > 0
                                    ? $t('已被禁言至：{time}', {
                                        time: Intl.DateTimeFormat(
                                            trueLang,
                                            getTimeConfig(
                                                new Date(
                                                    chat.info.me_info
                                                        .shut_up_timestamp *
                                                        1000,
                                                ),
                                            ),
                                        ).format(
                                            new Date(
                                                chat.info.me_info
                                                    .shut_up_timestamp * 1000,
                                            ),
                                        ),
                                    })
                                    : ''
                            "
                            @paste="addImg"
                            @keyup="mainKeyUp"
                            @click="selectSQIn()"
                            @input="searchMessage">
                        <textarea
                            v-else
                            id="main-input"
                            v-model="msg"
                            type="text"
                            :disabled="runtimeData.tags.openSideBar"
                            @paste="addImg"
                            @keydown="mainKey"
                            @keyup="mainKeyUp"
                            @click="selectSQIn()"
                            @input="searchMessage" />
                    </form>
                    <div @click="sendMsg">
                        <font-awesome-icon
                            v-if="details[3].open"
                            :icon="['fas', 'search']" />
                        <font-awesome-icon
                            v-else
                            :icon="['fas', 'angle-right']" />
                    </div>
                </div>
            </div>
            <div />
        </div>
        <!-- 合并转发消息预览器 -->
        <div :class="mergeList != undefined ? 'merge-pan show' : 'merge-pan'">
            <div @click="closeMergeMsg" />
            <div class="ss-card">
                <div>
                    <font-awesome-icon
                        style="margin-top: 5px"
                        :icon="['fas', 'message']" />
                    <span>{{ $t('合并消息') }}</span>
                    <font-awesome-icon
                        :icon="['fas', 'xmark']"
                        @click="closeMergeMsg" />
                </div>
                <div
                    :class="
                        'loading' +
                            (mergeList && mergeList.length == 0 ? ' show' : '')
                    ">
                    <font-awesome-icon :icon="['fas', 'spinner']" />
                    <span>{{ $t('加载中') }}</span>
                </div>
                <div>
                    <template
                        v-for="(msgIndex, index) in mergeList"
                        :key="'merge-' + index">
                        <NoticeBody
                            v-if="
                                isShowTime(
                                    mergeList[index - 1]
                                        ? mergeList[index - 1].time
                                        : undefined,
                                    msgIndex.time,
                                    index == 0,
                                )
                            "
                            :id="uuid()"
                            :key="'notice-time-' + index"
                            :data="{ sub_type: 'time', time: msgIndex.time }" />
                        <!-- 合并转发消息忽略是不是自己的判定 -->
                        <MsgBody
                            :data="msgIndex"
                            :type="'merge'" />
                    </template>
                </div>
            </div>
        </div>
        <!-- At 信息悬浮窗 -->
        <div class="mumber-info">
            <div
                v-if="
                    Object.keys(mumberInfo).length > 0 &&
                        mumberInfo.error === undefined
                "
                class="ss-card"
                :style="getPopPost()">
                <img
                    :src="
                        'https://q1.qlogo.cn/g?b=qq&s=0&nk=' +
                            mumberInfo.user_id
                    ">
                <div>
                    <span name="id">{{ mumberInfo.user_id }}</span>
                    <div>
                        <a>{{
                            mumberInfo.card == ''
                                ? mumberInfo.nickname
                                : mumberInfo.card
                        }}</a>
                        <div>
                            <span v-if="mumberInfo.role !== 'member'">
                                {{ $t('成员类型_' + mumberInfo.role) }}
                            </span>
                            <span>Lv {{ mumberInfo.level }}</span>
                        </div>
                    </div>
                    <span v-if="mumberInfo.join_time">
                        {{
                            $t('{time} 加入群聊', {
                                time: Intl.DateTimeFormat(trueLang, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                }).format(
                                    new Date(mumberInfo.join_time * 1000),
                                ),
                            })
                        }}
                    </span>
                </div>
            </div>
        </div>
        <!-- 消息右击菜单 -->
        <div
            :class="
                'msg-menu' +
                    (runtimeData.sysConfig.opt_no_window ? ' withBar' : '')
            ">
            <div
                v-show="tags.showMsgMenu"
                class="msg-menu-bg"
                @click="closeMsgMenu" />
            <div
                id="msgMenu"
                :class="
                    tags.showMsgMenu
                        ? 'ss-card msg-menu-body show'
                        : 'ss-card msg-menu-body'
                ">
                <div
                    v-if="runtimeData.chatInfo.show.type == 'group'"
                    v-show="tags.menuDisplay.showRespond"
                    :class="
                        'ss-card respond' +
                            (tags.menuDisplay.respond ? ' open' : '')
                    ">
                    <template
                        v-for="(num, index) in respondIds"
                        :key="'respond-' + num">
                        <img
                            v-if="getFace(num) != ''"
                            loading="lazy"
                            :src="getFace(num) as any"
                            @click="sendRespond(num)">
                        <font-awesome-icon
                            v-if="index == 4"
                            :icon="['fas', 'angle-up']"
                            @click="tags.menuDisplay.respond = true" />
                    </template>
                </div>
                <div
                    v-show="tags.menuDisplay.add"
                    @click="forwardSelf()">
                    <div><font-awesome-icon :icon="['fas', 'plus']" /></div>
                    <a>{{ $t('+ 1') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.relpy"
                    @click="replyMsg(true)">
                    <div><font-awesome-icon :icon="['fas', 'message']" /></div>
                    <a>{{ $t('回复') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.forward"
                    @click="showForWard()">
                    <div><font-awesome-icon :icon="['fas', 'share']" /></div>
                    <a>{{ $t('转发') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.select"
                    @click="intoMultipleSelect()">
                    <div>
                        <font-awesome-icon :icon="['fas', 'circle-check']" />
                    </div>
                    <a>{{ $t('多选') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.copy"
                    @click="copyMsg">
                    <div>
                        <font-awesome-icon :icon="['fas', 'clipboard']" />
                    </div>
                    <a>{{ $t('复制') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.copySelect"
                    @click="copySelectMsg">
                    <div><font-awesome-icon :icon="['fas', 'code']" /></div>
                    <a>{{ $t('复制选中文本') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.downloadImg != false"
                    @click="downloadImg">
                    <div>
                        <font-awesome-icon :icon="['fas', 'floppy-disk']" />
                    </div>
                    <a>{{ $t('下载图片') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.revoke"
                    @click="revokeMsg">
                    <div><font-awesome-icon :icon="['fas', 'xmark']" /></div>
                    <a>{{ $t('撤回') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.at"
                    @click="
                        selectedMsg
                            ? addSpecialMsg({
                                msgObj: { type: 'at', qq: selectedMsg.sender.user_id },
                                addText: true,
                            }): '';
                        toMainInput();
                        closeMsgMenu()
                    ">
                    <div><font-awesome-icon :icon="['fas', 'at']" /></div>
                    <a>{{ $t('提及') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.poke"
                    @click="
                        sendPoke(
                            selectedMsg
                                ? selectedMsg.sender.user_id
                                : undefined,
                        )
                    ">
                    <div>
                        <font-awesome-icon
                            :icon="['fas', 'fa-hand-point-up']" />
                    </div>
                    <a>{{ $t('戳一戳') }}</a>
                </div>
                <div
                    v-show="tags.menuDisplay.remove"
                    @click="removeUser">
                    <div>
                        <font-awesome-icon :icon="['fas', 'trash-can']" />
                    </div>
                    <a>{{ $t('移出群聊') }}</a>
                </div>
            </div>
        </div>
        <!-- 群 / 好友信息弹窗 -->
        <Transition>
            <Info
                :chat="chat"
                :tags="tags"
                @close="openChatInfoPan"
                @load-file="fileLoad" />
        </Transition>
        <!-- 图片发送器 -->
        <Transition>
            <div
                v-show="imgCache.length > 0"
                class="img-sender">
                <div class="card ss-card">
                    <div class="hander">
                        <span>{{ $t('发送图片') }}</span>
                        <button
                            class="ss-button"
                            @click="sendMsg">
                            {{ $t('发送') }}
                        </button>
                    </div>
                    <div class="imgs">
                        <div
                            v-for="(img64, index) in imgCache"
                            :key="'sendImg-' + index">
                            <div @click="deleteImg(index)">
                                <font-awesome-icon :icon="['fas', 'xmark']" />
                            </div>
                            <img :src="img64">
                        </div>
                    </div>
                    <div class="sender">
                        <font-awesome-icon
                            :icon="['fas', 'image']"
                            @click="runSelectImg" />
                        <input
                            v-model="msg"
                            type="text"
                            :disabled="runtimeData.tags.openSideBar"
                            @paste="addImg"
                            @click="toMainInput">
                    </div>
                </div>
                <div
                    class="bg"
                    @click="imgCache = []" />
            </div>
        </Transition>
        <!-- 转发面板 -->
        <Transition>
            <div
                v-if="tags.showForwardPan"
                class="forward-pan">
                <div class="ss-card card">
                    <header>
                        <span>{{ $t('转发消息') }}</span>
                        <font-awesome-icon
                            :icon="['fas', 'xmark']"
                            @click="cancelForward" />
                    </header>
                    <input
                        :placeholder="$t('搜索 ……')"
                        @input="searchForward">
                    <div>
                        <div
                            v-for="data in forwardList"
                            :key="
                                'forwardList-' + data.user_id
                                    ? data.user_id
                                    : data.group_id
                            "
                            @click="forwardMsg(data)">
                            <img
                                loading="lazy"
                                :title="
                                    data.group_name
                                        ? data.group_name
                                        : data.remark === data.nickname
                                            ? data.nickname
                                            : data.remark +
                                                '（' +
                                                data.nickname +
                                                '）'
                                "
                                :src="
                                    data.user_id
                                        ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' +
                                            data.user_id
                                        : 'https://p.qlogo.cn/gh/' +
                                            data.group_id +
                                            '/' +
                                            data.group_id +
                                            '/0'
                                ">
                            <div>
                                <p>
                                    {{
                                        data.group_name
                                            ? data.group_name
                                            : data.remark === data.nickname
                                                ? data.nickname
                                                : data.remark +
                                                    '（' +
                                                    data.nickname +
                                                    '）'
                                    }}
                                </p>
                                <span>{{
                                    data.group_id ? $t('群组') : $t('好友')
                                }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    class="bg"
                    @click="cancelForward" />
            </div>
        </Transition>
        <div
            class="bg"
            :style="
                runtimeData.sysConfig.option_view_background
                    ? `backdrop-filter: blur(${runtimeData.sysConfig
                        .chat_background_blur}px);`
                    : ''
            " />
    </div>
</template>

<script lang="ts">
    import app from '@renderer/main'
    import SendUtil from '@renderer/function/sender'
    import Option, { get } from '@renderer/function/option'
    import Info from '@renderer/pages/Info.vue'
    import MsgBody from '@renderer/components/MsgBody.vue'
    import NoticeBody from '@renderer/components/NoticeBody.vue'
    import FacePan from '@renderer/components/FacePan.vue'
    import imageCompression from 'browser-image-compression'

    import { defineComponent, markRaw, reactive } from 'vue'
    import { v4 as uuid } from 'uuid'
    import {
        downloadFile,
        loadHistory as loadHistoryFirst,
    } from '@renderer/function/utils/appUtil'
    import {
        getTimeConfig,
        getTrueLang,
        getViewTime,
    } from '@renderer/function/utils/systemUtil'
    import {
        getMsgRawTxt,
        sendMsgRaw,
        getFace,
    } from '@renderer/function/utils/msgUtil'
    import { scrollToMsg } from '@renderer/function/utils/appUtil'
    import { Logger, LogType, PopInfo, PopType } from '@renderer/function/base'
    import { Connector, login as loginInfo } from '@renderer/function/connect'
    import { runtimeData } from '@renderer/function/msg'
    import {
        BaseChatInfoElem,
        MsgItemElem,
        SQCodeElem,
        GroupMemberInfoElem,
        UserFriendElem,
        UserGroupElem,
    } from '@renderer/function/elements/information'

    export default defineComponent({
        name: 'ViewChat',
        components: { Info, MsgBody, NoticeBody, FacePan },
        props: ['chat', 'list', 'mergeList', 'mumberInfo', 'imgView'],
        data() {
            return {
                uuid,
                fun: {
                    getMsgRawTxt: getMsgRawTxt,
                },
                Option: Option,
                getFace: getFace,
                Connector: Connector,
                runtimeData: runtimeData,
                getTimeConfig: getTimeConfig,
                forwardList: runtimeData.userList,
                trueLang: getTrueLang(),
                multipleSelectList: [] as string[],
                tags: {
                    nowGetHistroy: false,
                    showBottomButton: true,
                    showMoreDetail: false,
                    showMsgMenu: false,
                    showForwardPan: false,
                    openedMenuMsg: {} as any | null,
                    openChatInfo: false,
                    isReply: false,
                    isJinLoading: false,
                    onAtFind: false,
                    menuDisplay: {
                        add: true,
                        relpy: true,
                        forward: true,
                        select: true,
                        copy: true,
                        copySelect: false,
                        downloadImg: false as string | false,
                        revoke: false,
                        at: true,
                        poke: false,
                        remove: false,
                        respond: false,
                        showRespond: true,
                    },
                    search: {
                        userId: -1,
                        list: reactive(this.list),
                    },
                    msgTouch: {
                        x: -1,
                        y: -1,
                        msgOnTouchDown: false,
                        onMove: 'no',
                    },
                    chatTouch: {
                        startX: -1,
                        startY: -1,
                        openSuccess: false,
                        onScroll: false
                    }
                },
                details: [
                    { open: false },
                    { open: false },
                    { open: false },
                    { open: false },
                ],
                msgMenus: [],
                NewMsgNum: 0,
                msg: '',
                imgCache: [] as string[],
                sendCache: [] as MsgItemElem[],
                selectedMsg: null as { [key: string]: any } | null,
                selectCache: '',
                replyMsgInfo: null,
                atFindList: null as GroupMemberInfoElem[] | null,
                getImgList: [] as {
                    index: number
                    message_id: string
                    img_url: string
                }[],
                respondIds: [
                    4, 5, 8, 9, 10, 12, 14, 16, 21, 23, 24, 25, 26, 27, 28, 29,
                    30, 32, 33, 34, 38, 39, 41, 42, 43, 49, 53, 60, 63, 66, 74,
                    75, 76, 78, 79, 85, 89, 96, 97, 98, 99, 100, 101, 102, 103,
                    104, 106, 109, 111, 116, 118, 120, 122, 123, 124, 125, 129,
                    144, 147, 171, 173, 174, 175, 176, 179, 180, 181, 182, 183,
                    201, 203, 212, 214, 219, 222, 227, 232, 240, 243, 246, 262,
                    264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 277, 278,
                    281, 282, 284, 285, 287, 289, 290, 293, 294, 297, 298, 299,
                    305, 306, 307, 314, 315, 318, 319, 320, 322, 324, 326,
                ],
            }
        },
        watch: {
            chat() {
                // 重置部分状态数据
                const data = (this as any).$options.data(this)
                this.tags = data.tags
                this.msgMenus = data.msgMenus
                this.sendCache = []
                this.imgCache = [] as string[]
                this.multipleSelectList = []
                this.initMenuDisplay()
            },
        },
        async mounted() {
            // 消息列表刷新
            this.updateList(this.list.length, 0)
            // PS：由于监听 list 本身返回的新旧值是一样，于是监听 length（反正也只要知道长度）
            this.$watch(() => this.list.length, this.updateList)
            //精华消息列表刷新
            this.$watch(
                () => this.chat.info.jin_info.list.length,
                () => {
                    this.tags.isJinLoading = false
                },
            )
            // 为 viewer 绑定关闭事件
            const viewer = app.config.globalProperties.$viewer
            this.$watch(
                () => viewer.hiding,
                (newVall) => {
                    if (newVall) {
                        runtimeData.chatInfo.info.image_list = this.getImgList
                    }
                },
            )
            // Capacitor：系统返回操作（Android）
            if(runtimeData.tags.isCapacitor && runtimeData.tags.platform === 'android') {
                const BaseAPI = runtimeData.plantform.capacitor.Plugins.App
                BaseAPI.addListener('backButton', () => {
                    // PS：这儿复用了触屏操作的逻辑……所以看起来怪怪的
                    this.tags.chatTouch.openSuccess = true
                    this.chatMoveEnd()
                })
            }
        },
        methods: {
            /**
             * 判断是否需要显示时间戳（上下超过五分钟的消息）
             * @param timePrv 上条消息的时间戳（10 位）
             * @param timeNow 当前消息的时间戳（10 位）
             */
            isShowTime(
                timePrv: number | undefined,
                timeNow: number,
                alwaysShow = false,
            ) {
                if (alwaysShow) return true
                if (timePrv == undefined) return false
                // 五分钟 10 位时间戳相差 300
                return timeNow - timePrv >= 300
            },

            /**
             * 消息区滚动
             * @param event 滚动事件
             */
            chatScroll(event: Event) {
                const body = event.target as HTMLDivElement
                const bar = document.getElementById('send-more')
                // 顶部
                if (body.scrollTop === 0 && this.list.length > 0) {
                    this.loadMoreHistory()
                }
                // 底部
                if ((body.scrollTop + body.clientHeight + 10) >= body.scrollHeight) {
                    this.NewMsgNum = 0
                    this.tags.showBottomButton = false
                    // 去除阴影
                    if (bar) {
                        bar.style.transition = 'background .3s'
                        bar.classList.add('btn')
                    }
                }
                // 显示回到底部
                if (
                    body.scrollTop <
                        body.scrollHeight - body.clientHeight * 2 &&
                    this.tags.showBottomButton !== true
                ) {
                    this.tags.showBottomButton = true
                }
                // 添加阴影
                if (
                    body.scrollTop <
                    body.scrollHeight - body.clientHeight - 10
                ) {
                    if (bar) {
                        bar.style.transition = 'background 1s'
                        bar.classList.remove('btn')
                    }
                }
            },

            /**
             * 加载更多历史消息
             */
            loadMoreHistory() {
                if (
                    !this.tags.nowGetHistroy &&
                    runtimeData.tags.canLoadHistory !== false
                ) {
                    // 获取列表第一条消息 ID
                    const firstMsgId = this.list[0].message_id
                    // 锁定加载防止反复触发
                    this.tags.nowGetHistroy = true
                    // 发起获取历史消息请求
                    const fullPage =
                        runtimeData.jsonMap.message_list?.pagerType == 'full'
                    const type = runtimeData.chatInfo.show.type
                    const id = runtimeData.chatInfo.show.id
                    let name
                    if (runtimeData.jsonMap.message_list && type != 'group') {
                        name = runtimeData.jsonMap.message_list.private_name
                    } else {
                        name = runtimeData.jsonMap.message_list.name
                    }
                    Connector.send(
                        name ?? 'get_chat_history',
                        {
                            group_id: type == 'group' ? id : undefined,
                            user_id: type != 'group' ? id : undefined,
                            message_id: firstMsgId,
                            count: fullPage? runtimeData.messageList.length + 20: 20,
                        },
                        'getChatHistory',
                    )
                }
            },

            /**
             * 消息区滚动到指定位置
             * @param where 位置（px）
             * @param showAnimation 是否使用动画
             */
            scrollTo(where: number | undefined, showAnimation = true) {
                const pan = document.getElementById('msgPan')
                if (pan !== null && where) {
                    if (showAnimation === false) {
                        pan.style.scrollBehavior = 'unset'
                    } else {
                        pan.style.scrollBehavior = 'smooth'
                    }
                    pan.scrollTop = where
                    pan.style.scrollBehavior = 'smooth'
                }
            },
            scrollBottom(showAnimation = false) {
                const pan = document.getElementById('msgPan')
                if (pan !== null) {
                    this.scrollTo(pan.scrollHeight, showAnimation)
                }
            },
            scrollToMsg(message_id: string) {
                if (!scrollToMsg(message_id, true)) {
                    new PopInfo().add(PopType.INFO, this.$t('无法定位上下文'))
                }
            },
            imgLoadedScroll() {
                const pan = document.getElementById('msgPan')
                if (pan && !this.tags.showBottomButton) {
                    this.scrollBottom()
                }
            },

            /**
             * 发送框按键事件
             * @param event 事件
             */
            mainKey(event: KeyboardEvent) {
                if (!event.shiftKey && event.keyCode == 13) {
                    // enter 发送消息
                    if (this.msg != '') {
                        this.sendMsg()
                    }
                }
            },
            mainKeyUp(event: KeyboardEvent) {
                const logger = new Logger()
                // 发送完成后输入框会遗留一个换行，把它删掉 ……
                if (
                    !event.shiftKey &&
                    event.keyCode == 13 &&
                    this.msg == '\n'
                ) {
                    this.msg = ''
                }
                if (event.keyCode != 13) {
                    // 获取最后一个输入的符号用于判定 at
                    const lastInput = this.msg.substring(this.msg.length - 1)
                    if (
                        !this.tags.onAtFind &&
                        lastInput == '@' &&
                        runtimeData.chatInfo.info.group_members.length > 0 &&
                        runtimeData.chatInfo.show.type == 'group'
                    ) {
                        logger.add(LogType.UI, '开始匹配群成员列表 ……')
                        this.tags.onAtFind = true
                    }
                    if (this.tags.onAtFind) {
                        if (this.msg.lastIndexOf('@') < 0) {
                            logger.add(LogType.UI, '匹配群成员列表被打断 ……')
                            this.tags.onAtFind = false
                            this.atFindList = null
                        } else {
                            const atInfo = this.msg
                                .substring(this.msg.lastIndexOf('@') + 1)
                                .toLowerCase()
                            if (atInfo != '') {
                                this.atFindList =
                                    runtimeData.chatInfo.info.group_members
                                        .filter((item) => {
                                            return (
                                                (item.card != '' &&
                                                    item.card != null &&
                                                    item.card
                                                        .toLowerCase()
                                                        .indexOf(atInfo) >=
                                                        0) ||
                                                item.nickname
                                                    .toLowerCase()
                                                    .indexOf(atInfo) >= 0 ||
                                                atInfo ==
                                                    item.user_id.toString()
                                            )
                                        },
                                    )
                            }
                        }
                    }
                }
            },

            /**
             * 通过表单提交方式发送消息
             * PS：主要用来解决一些奇奇怪怪的回车判定导致的问题
             */
            mainSubmit() {
                if (this.msg != '') {
                    this.sendMsg()
                }
            },

            /**
             * 选择 At
             * @param id QQ 号
             */
            choiceAt(id: number | undefined) {
                if (id != undefined) {
                    // 删除输入框内的 At 文本
                    this.msg = this.msg.substring(0, this.msg.lastIndexOf('@'))
                    // 添加 at 信息
                    this.addSpecialMsg({
                        msgObj: { type: 'at', qq: id },
                        addText: true,
                    })
                }
                this.toMainInput()
                this.tags.onAtFind = false
                this.atFindList = null
            },

            /**
             * 选中光标在其内部的那个 SQLCode
             */
            selectSQIn() {
                const input = document.getElementById(
                    'main-input',
                ) as HTMLInputElement
                // 如果文本框里本来就选中着什么东西就不触发了
                if (
                    input !== null &&
                    input.selectionStart === input.selectionEnd
                ) {
                    let cursurPosition = -1
                    if (typeof input.selectionStart === 'number') {
                        cursurPosition = input.selectionStart
                    }
                    // 获取所有的 SQCode
                    const getSQCode = SendUtil.getSQList(this.msg)
                    if (getSQCode != null) {
                        // 遍历寻找 SQCode 位置区间包括光标位置的 SQCode
                        getSQCode.forEach((item) => {
                            const start = this.msg.indexOf(item)
                            const end = start + item.length
                            if (
                                start !== -1 &&
                                cursurPosition > start &&
                                cursurPosition < end
                            ) {
                                this.$nextTick(() => {
                                    input.selectionStart = start
                                    input.selectionEnd = end
                                })
                            }
                        })
                    }
                }
            },

            /**
             * 显示右击菜单
             * @param event 右击事件
             * @param data 消息信息
             */
            showMsgMeun(event: Event, data: any) {
                this.selectedMsg = data

                if (Option.get('log_level') === 'debug') {
                    new Logger().debug('右击消息：' + data)
                }
                // 如果开着多选模式，不打开右击菜单
                if (this.multipleSelectList.length > 0) {
                    return
                }

                const menu = document.getElementById('msgMenu')
                let msg = event.currentTarget as HTMLDivElement
                const select = event.target as HTMLElement
                let selectUserType = 'member'
                if (
                    runtimeData.chatInfo.show.type == 'group' &&
                    runtimeData.chatInfo.info.group_members
                ) {
                    runtimeData.chatInfo.info.group_members.forEach(
                        (item: any) => {
                            if (item.user_id == data.sender.user_id) {
                                selectUserType = item.role
                            }
                        },
                    )
                }
                // FIX：Safari 的 contextmenu 事件并没有返回 currentTarget
                // 如果没有获取到 currentTarget，使用屏幕点击事件得到的值
                if (msg == null && this.tags.openedMenuMsg) {
                    msg = this.tags.openedMenuMsg.msg
                }
                if (menu !== null && msg !== null) {
                    // 关闭回应功能
                    if (get('close_respond') == true) {
                        this.tags.menuDisplay.showRespond = false
                    }
                    if (
                        select.nodeName == 'IMG' &&
                        (select as HTMLImageElement).name == 'avatar'
                    ) {
                        // 右击头像需要显示的内容
                        Object.keys(this.tags.menuDisplay).forEach(
                            (name: string) => {
                                (this.tags.menuDisplay as any)[name] = false
                            },
                        )
                        this.tags.menuDisplay.showRespond = false
                        this.tags.menuDisplay.at = true
                        this.tags.menuDisplay.poke = true
                        this.tags.menuDisplay.remove = true
                        if (
                            runtimeData.chatInfo.show.type != 'group' ||
                            data.sender.user_id === runtimeData.loginInfo.uin ||
                            runtimeData.chatInfo.info.me_info.role ===
                                'member' ||
                            selectUserType == 'owner' ||
                            selectUserType == 'admin'
                        ) {
                            // 自己、私聊或者没有权限的时候不显示移除
                            this.tags.menuDisplay.remove = false
                        }
                        if (data.sender.user_id === runtimeData.loginInfo.uin) {
                            // 自己不显示提及
                            this.tags.menuDisplay.at = false
                        }
                    } else {
                        // 检查消息，确认菜单显示状态
                        if (
                            data.sender.user_id === runtimeData.loginInfo.uin ||
                            runtimeData.chatInfo.info.me_info.role ===
                                'admin' ||
                            runtimeData.chatInfo.info.me_info.role === 'owner'
                        ) {
                            // 自己的消息、管理员和群主会显示撤回
                            this.tags.menuDisplay.revoke = true
                        }
                        if (data.revoke === true) {
                            // 已被撤回的自己的消息只显示复制
                            this.tags.menuDisplay.relpy = false
                            this.tags.menuDisplay.forward = false
                            this.tags.menuDisplay.revoke = false
                            this.tags.menuDisplay.select = false
                        }
                        const selection = document.getSelection()
                        const textBody = selection?.anchorNode?.parentElement
                        let textMsg = null as HTMLElement | null
                        // 向外寻找含有 message class 的父元素，直到遇到 chat class
                        let msgParent = textBody
                        if (msgParent) {
                            while (msgParent.className != 'chat') {
                                if (
                                    msgParent.className.startsWith('message') &&
                                    msgParent.className.indexOf('-') < 0
                                ) {
                                    textMsg = msgParent
                                    break
                                }
                                msgParent =
                                    msgParent.parentElement as HTMLDivElement
                                if (!msgParent) {
                                    break
                                }
                            }
                        }
                        if (
                            textBody &&
                            textBody.className.indexOf('msg-text') > -1 &&
                            selection.focusNode == selection.anchorNode &&
                            textMsg &&
                            textMsg.id == msg.id
                        ) {
                            // 用于判定是否选中了 msg-text 且开始和结束是同一个 Node（防止跨消息复制）
                            this.selectCache = selection.toString()
                            if (this.selectCache.length > 0) {
                                this.tags.menuDisplay.copySelect = true
                            }
                        }
                        const nList = ['xml', 'json']
                        data.message.forEach((item: any) => {
                            if (nList.indexOf(item.type as string) > 0) {
                                // 如果包含以上消息类型，不能转发
                                this.tags.menuDisplay.forward = false
                                this.tags.menuDisplay.add = false
                            }
                        })
                        if (select.nodeName == 'IMG') {
                            // 右击图片需要显示的内容，这边特例设置为链接
                            this.tags.menuDisplay.downloadImg = (
                                select as HTMLImageElement
                            ).src
                        }
                    }
                    // 鼠标位置
                    const pointEvent =
                        (event as PointerEvent) ||
                        (window.event as PointerEvent)
                    let pointX =
                        pointEvent.clientX -
                        msg.getBoundingClientRect().left +
                        20
                    let pointY = pointEvent.clientY
                    // FIX：Safari 的 contextmenu 事件的 Event 不完整
                    // 如果无法获取坐标则从触屏事件获取
                    if (pointY == undefined) {
                        pointX =
                            this.tags.openedMenuMsg.x -
                            msg.getBoundingClientRect().left +
                            20
                        pointY = this.tags.openedMenuMsg.y
                    }
                    // 移动菜单位置
                    menu.style.marginLeft = pointX + 'px'
                    menu.style.marginTop = pointY + 'px'
                    // 出界判定
                    let menuWidth = menu.clientWidth
                    if (this.tags.menuDisplay.showRespond) {
                        // 如果有回应功能，获取回应功能的宽度；它比菜单长
                        const item = menu.children[0] as HTMLDivElement
                        menuWidth = item.clientWidth
                    }
                    const msgWidth = msg.offsetWidth
                    if (pointX + menuWidth > msgWidth + 27) {
                        menu.style.marginLeft = msgWidth + 7 - menuWidth + 'px'
                    }
                    // 显示菜单
                    this.tags.showMsgMenu = true
                    // PS：在菜单完全显示出来之前获取不到正确的高度，所以延迟一下
                    setTimeout(() => {
                        // 出界判定
                        const menuHeight = menu.clientHeight
                        const bodyHeight = document.body.clientHeight
                        if (pointY + menuHeight > bodyHeight - 20) {
                            menu.classList.add('topOut')
                            menu.style.marginTop =
                                bodyHeight - menuHeight - 10 + 'px'
                        }
                    }, 100)
                    this.tags.openedMenuMsg = msg
                }
            },

            /**
             * 初始化菜单状态
             */
            initMenuDisplay() {
                this.tags.menuDisplay = {
                    add: true,
                    relpy: true,
                    forward: true,
                    select: true,
                    copy: true,
                    copySelect: false,
                    downloadImg: false,
                    revoke: false,
                    at: false,
                    poke: false,
                    remove: false,
                    respond: false,
                    showRespond: true,
                }
            },

            /**
             * 回复消息
             */
            replyMsg(closeMenu = true) {
                const msg = this.selectedMsg
                if (msg !== null) {
                    const msgId = msg.message_id
                    // 添加回复内容
                    // PS：这儿还是用旧的方式 …… 因为新的调用不友好。回复消息不会被加入文本行，在消息发送器内有特殊判定。
                    this.addSpecialMsg({
                        msgObj: { type: 'reply', id: String(msgId) },
                        addText: false,
                        addTop: true,
                    })
                    // 显示回复指示器
                    this.tags.isReply = true
                    // 聚焦输入框
                    this.toMainInput()
                    // 关闭消息菜单
                    if (closeMenu) {
                        this.closeMsgMenu()
                    }
                }
            },

            /**
             * 取消回复消息
             */
            cancelReply() {
                // 去除回复消息缓存
                this.sendCache = this.sendCache.filter((item) => {
                    return item.type !== 'reply'
                })
                this.tags.isReply = false
            },

            /**
             * 取消转发
             */
            cancelForward() {
                this.forwardList = runtimeData.userList
                this.tags.showForwardPan = false
                this.closeMsgMenu()
            },

            /**
             * 搜索转发列表
             * @param value 搜索内容
             */
            searchForward(event: Event) {
                const value = (event.target as HTMLInputElement).value
                this.forwardList = runtimeData.userList.filter(
                    (item: UserFriendElem & UserGroupElem) => {
                        const name = (
                            item.user_id? item.nickname + item.remark: item.group_name
                        ).toLowerCase()
                        const id = item.user_id ? item.user_id : item.group_id
                        return (
                            name.indexOf(value.toLowerCase()) !== -1 ||
                            id.toString() === value
                        )
                    },
                )
            },

            showForWard() {
                this.tags.showForwardPan = true
                const showList = runtimeData.onMsgList.reverse()
                // 将 forWardList 中 showList 之中的条目挪到最前面
                showList.forEach((item) => {
                    const index = this.forwardList.indexOf(item)
                    if (index > -1) {
                        this.forwardList.splice(index, 1)
                        this.forwardList.unshift(item)
                    }
                })
                runtimeData.onMsgList.reverse()
            },

            forwardSelf() {
                if (this.selectedMsg) {
                    const msg = JSON.parse(JSON.stringify(this.selectedMsg))
                    sendMsgRaw(
                        this.chat.show.id,
                        this.chat.show.type,
                        msg.message,
                        true,
                    )
                }
                this.closeMsgMenu()
            },

            intoMultipleSelect() {
                if (this.selectedMsg) {
                    this.multipleSelectList.push(this.selectedMsg.message_id)
                }
                this.closeMsgMenu()
            },

            /**
             * 转发消息
             */
            forwardMsg(data: UserFriendElem & UserGroupElem) {
                const msg = this.selectedMsg
                const id = data.group_id ? data.group_id : data.user_id
                if (this.multipleSelectList.length > 0 && msg) {
                    // 构造一条假的 json 消息用来渲染
                    const msgList = this.multipleSelectList.map((item) => {
                        const msg = runtimeData.messageList.find((msg) => {
                            return msg.message_id == item
                        })
                        if (msg) {
                            return msg
                        }
                    })
                    // 构造 titleList
                    const jsonMsg = {
                        app: 'com.tencent.multimsg',
                        meta: {
                            detail: {
                                source: '合并转发的消息',
                                news: [
                                    ...msgList.slice(0, 3).map((item) => {
                                        const name =
                                            item.sender.card &&
                                            item.sender.card != ''? item.sender.card: item.sender.nickname
                                        return {
                                            text:
                                                name +
                                                ': ' +
                                                getMsgRawTxt(item),
                                        }
                                    }),
                                ],
                                summary:
                                    '查看' +
                                    this.multipleSelectList.length +
                                    '条转发消息',
                                resid: '',
                            },
                        },
                    }
                    msg.message = [
                        { type: 'json', data: JSON.stringify(jsonMsg), id: '' },
                    ]
                    msg.sender = {
                        user_id: runtimeData.loginInfo.uin,
                        nickname: runtimeData.loginInfo.nickname,
                    }
                    // 二次确认转发
                    const popInfo = {
                        title: this.$t('合并转发消息'),
                        template: MsgBody,
                        templateValue: markRaw({ data: msg, type: 'forward' }),
                        button: [
                            {
                                text: this.$t('取消'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                },
                            },
                            {
                                text: this.$t('确定'),
                                master: true,
                                fun: () => {
                                    // 构建消息体
                                    const msgBody = msgList.map((item) => {
                                        return {
                                            type: 'node',
                                            id: item.message_id,
                                        }
                                    })
                                    sendMsgRaw(
                                        this.chat.show.id,
                                        this.chat.show.type,
                                        msgBody,
                                        true,
                                    )
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                } else if (this.selectedMsg && msg) {
                    // 二次确认转发
                    const popInfo = {
                        title: this.$t('转发消息'),
                        template: MsgBody,
                        templateValue: markRaw({ data: msg, type: 'forward' }),
                        button: [
                            {
                                text: this.$t('取消'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                },
                            },
                            {
                                text: this.$t('确定'),
                                master: true,
                                fun: () => {
                                    sendMsgRaw(
                                        this.chat.show.id,
                                        this.chat.show.type,
                                        msg.message,
                                        true,
                                    )
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
                // 关闭转发窗口
                this.cancelForward()
                // 将接收目标加入消息列表并跳转过去
                if (runtimeData.onMsgList.indexOf(data) < 0) {
                    runtimeData.onMsgList.push(data)
                }
                this.$nextTick(() => {
                    const user = document.getElementById('user-' + id)
                    if (user) {
                        user.click()
                    }
                })
            },

            /**
             * 发送消息回应
             * @param num
             */
            sendRespond(num: number) {
                const msg = this.selectedMsg
                if (msg !== null) {
                    const msgId = msg.message_id
                    Connector.send(
                        runtimeData.jsonMap.send_respond.name,
                        {
                            message_id: msgId,
                            emoji_id: String(num),
                        },
                        'SendRespondBack_' + msgId + '_' + num,
                    )
                }
                this.closeMsgMenu()
            },

            /**
             * 复制选中的消息
             */
            copyMsg() {
                const msg = this.selectedMsg
                if (msg !== null) {
                    // 如果消息体没有简述消息的话 ……
                    if (!msg.raw_message) {
                        msg.raw_message = getMsgRawTxt(msg)
                    }
                    const popInfo = new PopInfo()
                    app.config.globalProperties.$copyText(msg.raw_message).then(
                        () => {
                            popInfo.add(PopType.INFO, this.$t('复制成功'), true)
                        },
                        () => {
                            popInfo.add(PopType.ERR, this.$t('复制失败'), true)
                        },
                    )
                }
                this.closeMsgMenu()
            },

            /**
             * 复制缓存的选中的文本
             */
            copySelectMsg() {
                if (this.selectCache != '') {
                    const popInfo = new PopInfo()
                    app.config.globalProperties
                        .$copyText(this.selectCache)
                        .then(
                            () => {
                                popInfo.add(
                                    PopType.INFO,
                                    this.$t('复制成功'),
                                    true,
                                )
                            },
                            () => {
                                popInfo.add(
                                    PopType.ERR,
                                    this.$t('复制失败'),
                                    true,
                                )
                            },
                        )
                }
                this.closeMsgMenu()
            },

            /**
             * 下载选中的图片
             */
            downloadImg() {
                const url = this.tags.menuDisplay.downloadImg
                if (url != false) {
                    downloadFile(url as string, 'img.png', () => undefined)
                }
                this.closeMsgMenu()
            },

            /**
             * 撤回消息
             */
            revokeMsg() {
                const msg = this.selectedMsg
                if (msg !== null) {
                    const msgId = msg.message_id
                    Connector.send('delete_msg', { message_id: msgId })
                    // 关闭消息菜单
                    this.closeMsgMenu()
                }
            },

            /**
             * 移出群聊
             */
            removeUser() {
                const msg = this.selectedMsg
                if (msg !== null) {
                    const popInfo = {
                        title: this.$t('提醒'),
                        html: `<span>${this.$t('真的要将 {user} 移出群聊吗', { user: msg.sender.nickname })}</span>`,
                        button: [
                            {
                                text: app.config.globalProperties.$t('确定'),
                                fun: () => {
                                    if (msg) {
                                        Connector.send(
                                            'set_group_kick',
                                            {
                                                group_id:
                                                    runtimeData.chatInfo.show
                                                        .id,
                                                user_id: msg.sender.user_id,
                                            },
                                            'setGroupKick',
                                        )
                                        this.closeMsgMenu()
                                        runtimeData.popBoxList.shift()
                                    }
                                },
                            },
                            {
                                text: app.config.globalProperties.$t('取消'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
            },

            /**
             * 获取悬浮窗显示位置
             */
            getPopPost() {
                const x =
                    this.mumberInfo.x === undefined ? '0' : this.mumberInfo.x
                const y =
                    this.mumberInfo.y === undefined ? '0' : this.mumberInfo.y
                return 'margin-left:' + x + 'px;margin-top:' + y + 'px;'
            },

            /**
             * 关闭右击菜单
             */
            closeMsgMenu() {
                // 关闭菜单
                this.tags.showMsgMenu = false
                if (this.tags.openedMenuMsg) this.tags.openedMenuMsg = null
                setTimeout(() => {
                    // 重置菜单显示状态
                    this.initMenuDisplay()
                }, 300)
            },

            /**
             * 关闭合并转发弹窗
             */
            closeMergeMsg() {
                this.runtimeData.mergeMessageList = undefined
            },

            /**
             * 打开好友/群组信息页面
             */
            openChatInfoPan() {
                this.tags.openChatInfo = !this.tags.openChatInfo
                // 加载一些需要显示的消息，有部分判断是用来防止反复加载已存在内容的
                if (this.tags.openChatInfo) {
                    // 加载基础信息
                    if (
                        this.chat.show.type === 'group' &&
                        this.chat.info.group_info.gc !== this.chat.show.id
                    ) {
                        const url = `https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_info_all?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}`
                        Connector.send(
                            'http_proxy',
                            { url: url },
                            'getMoreGroupInfo',
                        )
                    } else if (
                        this.chat.show.type === 'user' &&
                        this.chat.info.user_info.uin !== this.chat.show.id
                    ) {
                        const userInfo = runtimeData.jsonMap.friend_info.name
                        if(userInfo != undefined) {
                            Connector.send(
                                userInfo,
                                { user_id: this.chat.show.id },
                                'getMoreUserInfo',
                            )
                        }
                    }
                    // 加载群公告列表
                    const noticeName = runtimeData.jsonMap.group_notices.name
                    if (
                        this.chat.show.type === 'group' &&
                        (this.chat.info.group_notices === undefined ||
                            Object.keys(this.chat.info.group_notices).length ===
                                0)
                    ) {
                        if (noticeName && noticeName != 'http_proxy') {
                            Connector.send(
                                noticeName,
                                { group_id: this.chat.show.id },
                                'getGroupNotices',
                            )
                        } else {
                            const url = `https://web.qun.qq.com/cgi-bin/announce/get_t_list?bkn=${runtimeData.loginInfo.bkn}&qid=${this.chat.show.id}&ft=23&s=-1&n=20`
                            Connector.send(
                                'http_proxy',
                                { url: url },
                                'getGroupNotices',
                            )
                        }
                    }
                    // 加载群文件列表
                    if (
                        this.chat.show.type === 'group' &&
                        Object.keys(this.chat.info.group_files).length === 0
                    ) {
                        const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=0&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
                        Connector.send(
                            'http_proxy',
                            { url: url },
                            'getGroupFiles',
                        )
                    }
                }
            },

            // /**
            //  * 加载更多文件
            //  */
            fileLoad(event: Event) {
                const sender = event.currentTarget as HTMLDivElement
                if (
                    sender.scrollTop + sender.clientHeight >=
                        sender.scrollHeight &&
                    this.chat.info.group_files.next_index !== 0 &&
                    this.chat.info.group_files.next_index !==
                        this.chat.info.group_files.total_cnt
                ) {
                    const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=${this.chat.info.group_files.next_index}&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
                    Connector.send(
                        'http_proxy',
                        { url: url },
                        'getMoreGroupFiles',
                    )
                }
            },

            /**
             * 根据 index 删除图片
             * @param { number } index 图片编号
             */
            deleteImg(index: number) {
                this.imgCache.splice(index, 1)
            },

            /**
             * 添加特殊消息结构
             * @param data obj
             */
            addSpecialMsg(data: SQCodeElem) {
                if (data !== undefined) {
                    const index = this.sendCache.length
                    this.sendCache.push(data.msgObj)
                    if (data.addText === true) {
                        if (data.addTop === true) {
                            this.msg = '[SQ:' + index + ']' + this.msg
                        } else {
                            this.msg += '[SQ:' + index + ']'
                        }
                    }
                    return index
                }
                return -1
            },

            /**
             * 添加图片缓存
             * @param event 事件
             */
            addImg(event: ClipboardEvent) {
                // 判断粘贴类型
                if (!(event.clipboardData && event.clipboardData.items)) {
                    return
                }
                for (
                    let i = 0, len = event.clipboardData.items.length;
                    i < len;
                    i++
                ) {
                    const item = event.clipboardData.items[i]
                    if (item.kind === 'file') {
                        this.setImg(item.getAsFile())
                        // 阻止默认行为
                        event.preventDefault()
                    }
                }
            },

            runSelectImg() {
                const input = document.getElementById('choice-pic')
                if (input) {
                    input.click()
                }
            },
            /**
             * 手动选择图片
             */
            selectImg(event: Event) {
                this.tags.showMoreDetail = false
                const sender = event.target as HTMLInputElement
                if (sender && sender.files) {
                    this.setImg(sender.files[0])
                }
            },

            runSelectFile() {
                const input = document.getElementById('choice-file')
                if (input) {
                    input.click()
                }
            },
            /**
             * 选择文件
             */
            async selectFile(event: Event) {
                this.tags.showMoreDetail = false
                const sender = event.target as HTMLInputElement
                if (sender.files != null) {
                    // 构建请求参数
                    const formData = new FormData()
                    formData.append('type', runtimeData.chatInfo.show.type)
                    formData.append('id', String(runtimeData.chatInfo.show.id))
                    formData.append('file', sender.files[0])
                    // 请求
                    try {
                        const onProgress = function (e: ProgressEvent) {
                            const percent = Math.round(
                                (e.loaded / e.total) * 100,
                            )
                            if (percent % 10 === 0) {
                                new PopInfo().add(
                                    PopType.INFO,
                                    app.config.globalProperties.$t(
                                        '正在发送文件 {percent}%',
                                        {
                                            percent: percent,
                                        },
                                    ),
                                )
                            }
                        }

                        const ssl = runtimeData.tags.connectSsl? 'https://': 'http://'

                        const url = ssl + loginInfo.address + '/upload_file'
                        const xhr = new XMLHttpRequest()
                        xhr.upload.onprogress = onProgress
                        xhr.open('POST', url, true)
                        xhr.setRequestHeader('authorization', loginInfo.token)
                        xhr.send(formData)
                        xhr.onreadystatechange = function () {
                            const data = JSON.parse(xhr.responseText)
                            if (Object.keys(data).length > 0) {
                                // 发送成功，直接刷新整个历史消息
                                loadHistoryFirst(runtimeData.chatInfo.show)
                            } else {
                                new PopInfo().add(
                                    PopType.ERR,
                                    app.config.globalProperties.$t(
                                        '发送文件失败',
                                    ),
                                )
                            }
                        }
                    } catch (e) {
                        new PopInfo().add(
                            PopType.ERR,
                            app.config.globalProperties.$t('发送文件错误'),
                        )
                    }
                }
            },

            /**
             * 将图片转换为 base64 并缓存
             * @param blob 文件对象
             */
            async setImg(blob: File | null) {
                const popInfo = new PopInfo()
                if (
                    blob !== null &&
                    blob.type.indexOf('image/') >= 0 &&
                    blob.size !== 0
                ) {
                    if (blob.size < 3145728) {
                        // 转换为 Base64
                        const reader = new FileReader()
                        reader.readAsDataURL(blob)
                        reader.onloadend = () => {
                            const base64data = reader.result as string
                            if (base64data !== null) {
                                if (Option.get('close_chat_pic_pan') === true) {
                                    // 在关闭图片插入面板的模式下将直接以 SQCode 插入输入框
                                    const data = {
                                        addText: true,
                                        msgObj: {
                                            type: 'image',
                                            file:
                                                'base64://' +
                                                base64data.substring(
                                                    base64data.indexOf(
                                                        'base64,',
                                                    ) + 7,
                                                    base64data.length,
                                                ),
                                        },
                                    }
                                    this.addSpecialMsg(data)
                                } else {
                                    // 记录图片信息
                                    // 只要你内存够猛，随便 cache 图片，这边就不做限制了
                                    this.imgCache.push(base64data)
                                }
                            }
                        }
                    } else {
                        // 压缩图片
                        const options = { maxSizeMB: 3, useWebWorker: true }
                        try {
                            popInfo.add(
                                PopType.INFO,
                                this.$t('正在压缩图片 ……'),
                            )
                            const compressedFile = await imageCompression(
                                blob,
                                options,
                            )
                            new Logger().add(
                                LogType.INFO,
                                '图片压缩成功，原大小：' +
                                    blob.size / 1024 / 1024 +
                                    ' MB，压缩后大小：' +
                                    compressedFile.size / 1024 / 1024 +
                                    ' MB',
                            )
                            this.setImg(compressedFile)
                        } catch (error) {
                            popInfo.add(PopType.INFO, this.$t('压缩图片失败'))
                        }
                    }
                }
            },

            /**
             * 将焦点移回主发送框
             * PS：我实在懒得再做一次回车发送了。所以当点击图片发送框的输入框后，焦点会被移动到主输入框上以方便回车发送
             */
            toMainInput() {
                const mainInput = document.getElementById('main-input')
                if (mainInput !== null) {
                    mainInput.focus()
                }
            },

            /**
             * 发送消息
             */
            sendMsg() {
                // 在搜索消息的时候不允许发送消息
                if (this.details[3].open) {
                    return
                }
                // 关闭所有其他的已打开的更多功能弹窗
                this.details.forEach((item) => {
                    item.open = false
                })
                // 为了减少对于复杂图文排版页面显示上的工作量，对于非纯文本的消息依旧处理为纯文本，如：
                // "这是一段话 [SQ:0]，[SQ:1] 你要不要来试试 Stapxs QQ Lite？"
                // 其中 [SQ:n] 结构代表着这是特殊消息以及这个消息具体内容在消息缓存中的 index，像是这样：
                // sendCache = [{type:"face",id:11},{type:"at",qq:1007028430}]
                //               ^^^^^^^ 0 ^^^^^^^   ^^^^^^^^^^ 1 ^^^^^^^^^^
                // 在发送操作触发之后，将会解析此条字符串排列出最终需要发送的消息结构用于发送。
                const msg = SendUtil.parseMsg(
                    this.msg,
                    this.sendCache,
                    this.imgCache,
                )
                if (this.chat.show.temp) {
                    sendMsgRaw(
                        this.chat.show.id + '/' + this.chat.show.temp,
                        this.chat.show.type,
                        msg,
                        true,
                    )
                } else {
                    sendMsgRaw(
                        this.chat.show.id,
                        this.chat.show.type,
                        msg,
                        true,
                    )
                }
                // 发送后事务
                this.msg = ''
                this.sendCache = []
                this.imgCache = []
                this.scrollBottom()
                this.cancelReply()
            },

            updateList(newLength: number, oldLength: number) {
                // =================== 首次加载消息 ===================

                if (oldLength == 0 && newLength > 0) {
                    const name =
                        runtimeData.jsonMap.set_message_read?.name ?? undefined
                    let private_name =
                        runtimeData.jsonMap.set_message_read?.private_name ??
                        name
                    if (!private_name) private_name = name
                    // 设置最后一条消息以上都为已读
                    if (runtimeData.chatInfo.show.type == 'group') {
                        Connector.send(
                            name,
                            {
                                group_id: this.chat.show.id,
                                message_id:
                                    this.list[this.list.length - 1].message_id,
                            },
                            'setMessageRead',
                        )
                    } else {
                        Connector.send(
                            private_name,
                            {
                                user_id: this.chat.show.id,
                                message_id:
                                    this.list[this.list.length - 1].message_id,
                            },
                            'setMessageRead',
                        )
                    }
                    if(runtimeData.tags.isElectron) {
                        // 将焦点移动到发送框
                        this.toMainInput()
                    }
                }

                // =================== 刷新统计数据 ===================

                // 判断新消息数量（回到底部按钮显示、不在加载历史消息、不是首次加载消息）
                if (
                    this.tags.showBottomButton &&
                    !this.tags.nowGetHistroy &&
                    oldLength > 0
                ) {
                    if (this.NewMsgNum !== 0) {
                        this.NewMsgNum =
                            this.NewMsgNum + Math.abs(newLength - oldLength)
                    } else {
                        this.NewMsgNum = Math.abs(newLength - oldLength)
                    }
                }
                // 清屏重新加载消息列表（超过 n 条消息、回到底部按钮不显示）
                // PS：也就是说只在消息底部时才会触发，以防止你是在看历史消息攒满了刷掉
                if (
                    this.list.length > 200 &&
                    !this.tags.nowGetHistroy &&
                    !this.tags.showBottomButton
                ) {
                    runtimeData.messageList = []
                    const info = {
                        type: this.chat.show.type,
                        id: this.chat.show.id,
                        name: this.chat.show.name,
                        avatar: this.chat.show.avatar,
                        jump: this.chat.show.jump,
                    } as BaseChatInfoElem
                    loadHistoryFirst(info)
                    this.tags.nowGetHistroy = true
                }

                // =================== 渲染监听操作 ===================

                const pan = document.getElementById('msgPan')
                if (pan !== null) {
                    // 渲染前的数据
                    const height = pan.scrollHeight
                    // const top = pan.scrollTop
                    // 渲染后操作
                    this.$nextTick(() => {
                        const newPan = document.getElementById('msgPan')
                        if (newPan !== null) {
                            // 加载历史记录锁定滚动条位置
                            if (this.tags.nowGetHistroy) {
                                this.scrollTo(
                                    newPan.scrollHeight - height,
                                    false,
                                )
                            }
                            // 新消息自动下滚（只要回到底部按钮没显示就算是在最底部、首次加载（不需要滚动动画））
                            if (!this.tags.nowGetHistroy) {
                                if (!this.tags.showBottomButton) {
                                    this.scrollTo(newPan.scrollHeight)
                                }
                                if (oldLength <= 0) {
                                    this.scrollTo(newPan.scrollHeight, false)
                                }
                            }
                            // 解除锁定加载
                            this.tags.nowGetHistroy = false
                        }
                        // 刷新图片列表
                        // TODO: 需要优化性能
                        let initMainList = false
                        if (this.getImgList.length == 0) initMainList = true
                        this.getImgList = []
                        this.list.forEach((item: any) => {
                            if (item.message !== undefined) {
                                item.message.forEach((msg: MsgItemElem) => {
                                    if (
                                        msg.type === 'image' &&
                                        msg.file != 'marketface'
                                    ) {
                                        const info = {
                                            index: item.message_id,
                                            message_id: item.message_id,
                                            img_url: msg.url,
                                        }
                                        this.getImgList.push(info)
                                    }
                                })
                            }
                        })
                        const viewer = app.config.globalProperties.$viewer
                        if (!viewer.isShown || initMainList) {
                            runtimeData.chatInfo.info.image_list =
                                this.getImgList
                        }
                        // 处理跳入跳转预设
                        // 如果 jump 参数不是 undefined，则意味着这次加载历史记录的同时需要跳转到指定的消息
                        if (
                            runtimeData.chatInfo.show &&
                            runtimeData.chatInfo.show.jump
                        ) {
                            new Logger().debug(
                                '进入跳转至消息：' +
                                    runtimeData.chatInfo.show.jump,
                            )
                            this.scrollToMsg(
                                'chat-' + runtimeData.chatInfo.show.jump,
                            )
                            runtimeData.chatInfo.show.jump = undefined
                        }
                    })
                }
            },

            msgClick(_: Event, data: any) {
                const message_id = data.message_id
                if (this.multipleSelectList.length > 0) {
                    if (this.multipleSelectList.indexOf(message_id) > -1) {
                        this.multipleSelectList =
                            this.multipleSelectList.filter((item) => {
                                return item != message_id
                            })
                    } else {
                        this.multipleSelectList.push(message_id)
                    }
                }
            },

            delMsgs() {
                new PopInfo().add(
                    PopType.INFO,
                    this.$t('欸嘿，这个按钮只是用来占位置的'),
                )
            },

            copyMsgs() {
                const msgList = this.list.filter((item: any) => {
                    return this.multipleSelectList.indexOf(item.message_id) > -1
                })
                let msg = ''
                let lastDate = ''
                msgList.forEach((item: any) => {
                    // 去除 item.time 时间戳中的时间，只保留日期
                    const time = new Date(getViewTime(item.time))
                    const date =
                        time.getFullYear() +
                        '-' +
                        (time.getMonth() + 1) +
                        '-' +
                        time.getDate()
                    if (date != lastDate) {
                        msg += '\n—— ' + date + ' ——\n'
                        lastDate = date
                    }
                    msg +=
                        item.sender.nickname +
                        ' ' +
                        time.getHours() +
                        ':' +
                        time.getMinutes() +
                        ':' +
                        time.getSeconds() +
                        '\n' +
                        getMsgRawTxt(item) +
                        '\n\n'
                })
                const popInfo = new PopInfo()
                app.config.globalProperties.$copyText(msg).then(
                    () => {
                        popInfo.add(PopType.INFO, this.$t('复制成功'), true)
                        this.multipleSelectList = []
                    },
                    () => {
                        popInfo.add(PopType.ERR, this.$t('复制失败'), true)
                    },
                )
            },

            /**
             * 消息触屏开始
             * @param event 触摸事件
             */
            msgStartMove(event: TouchEvent, msg: any) {
                const logger = new Logger()
                logger.add(LogType.UI, '消息触屏点击事件开始 ……')
                this.tags.msgTouch.msgOnTouchDown = true
                this.tags.msgTouch.x = event.targetTouches[0].pageX
                this.tags.msgTouch.y = event.targetTouches[0].pageY

                // PS：保存这个只是在 Safari 下菜单事件无法获取到
                this.tags.openedMenuMsg = {
                    msg: event.currentTarget as HTMLDivElement,
                    x: event.targetTouches[0].pageX,
                    y: event.targetTouches[0].pageY,
                }

                // 消息长按事件，计时判定长按
                setTimeout(() => {
                    logger.add(
                        LogType.UI,
                        '消息触屏长按判定：' +
                            this.tags.msgTouch.msgOnTouchDown,
                    )
                    if (this.tags.msgTouch.msgOnTouchDown === true) {
                        this.showMsgMeun(event, msg)
                    }
                }, 400)
            },

            /**
             * 消息触屏移动
             * @param event 触摸事件
             */
            msgOnMove(event: TouchEvent) {
                const logger = new Logger()
                const sender = event.currentTarget as HTMLDivElement
                const msgPan = document.getElementById('msgPan')
                // 开始点击的位置
                const startX = this.tags.msgTouch.x
                const startY = this.tags.msgTouch.y
                // TODO: 懒得写了，移动的允许范围，用来防止按住了挪出控件范围导致无法触发 end
                // const maxTop = sender.
                if (startX > -1 && startY > -1 && msgPan) {
                    // 计算移动差值
                    const dx = Math.abs(startX - event.targetTouches[0].pageX)
                    const dy = Math.abs(startY - event.targetTouches[0].pageY)
                    const x = startX - event.targetTouches[0].pageX
                    // 如果 dy 大于 10px 则判定为用户在滚动页面，打断长按消息判定
                    if (dy > 10) {
                        this.tags.chatTouch.onScroll = true
                    }
                    if (dy > 10 || dx > 5) {
                        if (this.tags.msgTouch.msgOnTouchDown) {
                            logger.add(LogType.UI, '用户正在滑动，打断长按判定。')
                            this.tags.msgTouch.msgOnTouchDown = false
                        }
                    }
                    if (dy < sender.offsetHeight / 3 && dy < 40) {
                        this.tags.msgTouch.onMove = 'on'
                        if (x > 10) {
                            // 右滑
                            if (dx >= sender.offsetWidth / 3) {
                                this.tags.msgTouch.onMove = 'left'
                                logger.add(
                                    LogType.UI,
                                    '触发左滑判定 ……（回复）',
                                )
                            } else {
                                sender.style.transform =
                                    'translate(-' + (Math.sqrt(dx) + 5) + 'px)'
                                sender.style.transition = 'transform 0s'
                            }
                        }
                    } else {
                        this.tags.msgTouch.onMove = 'no'
                        sender.style.transform = 'translate(0px)'
                    }
                }
            },

            /**
             * 消息触屏结束
             * @param event 触摸事件
             * @param msg 消息对象
             */
            msgMoveEnd(event: Event, msg: any) {
                const sender = event.currentTarget as HTMLDivElement
                sender.style.transform = 'translate(0px)'
                // 判断操作
                if (this.tags.msgTouch.onMove == 'left') {
                    // 左滑回复
                    this.selectedMsg = msg
                    this.replyMsg(false)
                } else if (this.tags.msgTouch.onMove == 'right') {
                    // 右滑转发
                }
                // 重置数据
                const data = (this as any).$options.data(this)
                this.tags.msgTouch = data.tags.msgTouch
            },

            /**
             * 获取显示群精华消息
             */
            showJin() {
                this.details[2].open = !this.details[2].open
                if (runtimeData.chatInfo.info.jin_info.list.length == 0) {
                    // `https://qun.qq.com/cgi-bin/group_digest/digest_list?bkn=${runtimeData.loginInfo.bkn}&group_code=${this.chat.show.id}&page_start=0&page_limit=40`
                    const name =
                        runtimeData.jsonMap.group_essence.name ??
                        'get_essence_msg_list'
                    Connector.send(
                        name,
                        {
                            group_id: this.chat.show.id,
                            pages: 0,
                        },
                        'getJin',
                    )
                }
                this.tags.showMoreDetail = !this.tags.showMoreDetail
            },

            searchMessage(event: Event) {
                if (this.details[3].open) {
                    const value = (event.target as HTMLInputElement).value
                    if (value.length == 0) {
                        this.tags.search.list = reactive(this.list)
                    } else if (value.length > 0) {
                        this.tags.search.list = this.list.filter(
                            (item: any) => {
                                const rawMessage = getMsgRawTxt(item)
                                return rawMessage.indexOf(value) !== -1
                            },
                        )
                    }
                }
            },
            openSearch() {
                this.details[3].open = !this.details[3].open
                this.tags.showMoreDetail = !this.tags.showMoreDetail
            },
            closeSearch() {
                this.details[3].open = !this.details[3].open
                this.msg = ''
                this.tags.search.list = reactive(this.list)
            },

            /**
             * 发送戳一戳
             */
            sendPoke(user_id: number) {
                if (runtimeData.jsonMap.poke) {
                    let name = runtimeData.jsonMap.poke.name
                    if (
                        this.chat.show.type == 'user' &&
                        runtimeData.jsonMap.poke.private_name
                    ) {
                        name = runtimeData.jsonMap.poke.private_name
                    }
                    Connector.send(
                        name,
                        {
                            user_id: user_id,
                            group_id: this.chat.show.id,
                        },
                        'sendPoke',
                    )
                }
                this.tags.showMoreDetail = false
                this.tags.menuDisplay.poke = false
            },

            /**
             * 精华消息滚动事件
             */
            jinScroll(event: Event) {
                const body = event.target as HTMLDivElement
                // 滚动到底部，加载更多
                if (
                    body.scrollTop + body.clientHeight === body.scrollHeight &&
                    !this.tags.isJinLoading
                ) {
                    if (this.chat.info.jin_info.is_end == false) {
                        this.tags.isJinLoading = true
                        const name =
                            runtimeData.jsonMap.group_essence.name ??
                            'get_essence_msg_list'
                        Connector.send(
                            name,
                            {
                                group_id: this.chat.show.id,
                                pages: this.chat.info.jin_info.pages + 1,
                            },
                            'getJin',
                        )
                    }
                }
            },

            /**
             * 更多功能按钮被点击
             */
            moreFunClick() {
                let hasOpen = false
                // 关闭所有其他的已打开的更多功能弹窗
                this.details.forEach((item) => {
                    if (item.open) hasOpen = true
                    item.open = false
                })
                // 如果有关闭操作，就不打开更多功能菜单
                if (!hasOpen) {
                    this.tags.showMoreDetail = !this.tags.showMoreDetail
                }
            },

            openLeftBar() {
                runtimeData.tags.openSideBar = !runtimeData.tags.openSideBar
            },

            // 聊天面板右滑操作
            ChatOnMove(event: TouchEvent) {
                const chatPan = document.getElementById('chat-pan')
                if(chatPan) {
                    // 暂时去除 transition 过渡防止不跟手
                    chatPan.style.transition = 'all 0s'
                    // 获取 x 轴的位置
                    const x = event.targetTouches[0].pageX
                    const y = event.targetTouches[0].pageY
                    // 记录开始位置
                    if(this.tags.chatTouch.startX == -1) {
                        this.tags.chatTouch.startX = x
                    }
                    if(this.tags.chatTouch.startY == -1) {
                        this.tags.chatTouch.startY  = y
                    }
                    const moveX = Math.abs(x - this.tags.chatTouch.startX)
                    const moveY = Math.abs(y - this.tags.chatTouch.startY)
                    const width = document.body.clientWidth
                    const heightAllow = document.body.clientHeight * 0.05

                    const allowMove = moveX > moveY
                        && moveY < heightAllow
                        && x - this.tags.chatTouch.startX > 0
                    if(allowMove) {
                        if(this.tags.openChatInfo) {
                            // 聊天信息面板返回
                            const infoPan = chatPan.getElementsByClassName('chat-info-pan')[0] as HTMLDivElement
                            if(infoPan) {
                                infoPan.style.transition = 'all 0s'
                                infoPan.style.transform =
                                    'translateX(' + (x - this.tags.chatTouch.startX) + 'px)'
                                this.tags.chatTouch.openSuccess =
                                    moveX > width / 3
                            }
                        } else if(this.mergeList != undefined) {
                            // 合并转发面板返回
                            const mergePan = chatPan.getElementsByClassName('merge-pan')[0] as HTMLDivElement
                            if(mergePan) {
                                mergePan.style.transition = 'all 0s'
                                mergePan.style.transform =
                                    'translateX(' + (x - this.tags.chatTouch.startX) + 'px)'
                                this.tags.chatTouch.openSuccess =
                                    moveX > width / 3
                            }
                        } else {
                            // 聊天面板底层返回
                            chatPan.style.transform = 'translateX(' + (x - this.tags.chatTouch.startX) + 'px)'
                            this.tags.chatTouch.openSuccess = moveX > width / 3
                            // 禁用滚动
                            const chat = chatPan.getElementsByClassName('chat')[0] as HTMLDivElement
                            if(chat) {
                                chat.style.overflowY = 'hidden'
                            }
                        }
                    }
                }
            },

            // 聊天面板右滑结束
            chatMoveEnd() {
                this.tags.chatTouch.startX = -1
                this.tags.chatTouch.startY = -1
                const chatPan = document.getElementById('chat-pan')
                if(chatPan) {
                    if(!this.tags.chatTouch.openSuccess) {
                        if(this.tags.openChatInfo) {
                            const infoPan = chatPan.getElementsByClassName('chat-info-pan')[0] as HTMLDivElement
                            if(infoPan) {
                                infoPan.style.transition = 'transform 0.3s'
                                infoPan.style.transform = ''
                            }
                        } else if(this.mergeList != undefined) {
                            const mergePan = chatPan.getElementsByClassName('merge-pan')[0] as HTMLDivElement
                            if(mergePan) {
                                mergePan.style.transform = ''
                            }
                        } else {
                            runtimeData.tags.openSideBar = false
                        }
                    } else {
                        if(this.tags.openChatInfo) {
                            this.openChatInfoPan()
                        } else if(this.mergeList != undefined) {
                            this.closeMergeMsg()
                            setTimeout(() => {
                                const mergePan = chatPan.getElementsByClassName('merge-pan')[0] as HTMLDivElement
                                if(mergePan) {
                                    mergePan.style.transform = ''
                                }
                            }, 500)
                         } else {
                            runtimeData.tags.openSideBar = true
                            new Logger().add(LogType.UI, '右滑打开侧边栏触发完成')
                        }
                    }
                    // 恢复过渡效果，完成撒手之后的剩余动画
                    chatPan.style.transition = ''
                    setTimeout(() => {
                        chatPan.style.transform = ''
                    }, 100)
                    // 恢复滚动
                    const chat = chatPan.getElementsByClassName('chat')[0] as HTMLDivElement
                    if(chat) {
                        chat.style.overflowY = 'scroll'
                    }
                }
                this.tags.chatTouch.openSuccess = false
                this.tags.chatTouch.onScroll = false
            }
        },
    })
</script>

<style scoped>
    /* 消息动画 */
    .msglist-move {
        transition: all 0.3s;
    }

    .msglist-enter-active {
        transition: all 0.4s;
    }

    .msglist-leave-active {
        transition: all 0.2s;
    }

    .msglist-enter-from {
        transform: translateX(-20px);
        opacity: 0;
    }

    .msglist-leave-to {
        opacity: 0;
    }

    /* 更多功能面板动画 */
    .pan-enter-active,
    .pan-leave-active {
        transition: opacity 0.3s;
    }

    .pan-enter-from {
        transform: translateX(20px);
        opacity: 0;
    }

    .pan-leave-to {
        opacity: 0;
    }
</style>
