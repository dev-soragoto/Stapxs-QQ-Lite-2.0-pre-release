\<!--
 * @FileDescription: 群成员消息悬浮窗
 * @Author: Mr.Lee
 * @Date: 2025/09/01
 * @Version: 1.0
-->
<template>
    <Teleport to="body">
        <Transition name="member-info">
            <div v-if="data.user" class="member-info" :style="posInfo">
                <!-- 已退群 -->
                <div v-if="typeof data.user === 'number'"
                    ref="body"
                    class="ss-card leave">
                    <div>
                        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user">
                        <div>
                            <span name="id">{{ data.user }}</span>
                            <div>
                                <a>{{ $t('已退群( {userId} )', { userId: data.user }) }}</a>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 群成员 -->
                <div v-else
                    ref="body"
                    class="ss-card">
                    <div>
                        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user.user_id">
                        <div>
                            <span name="id">{{ data.user.user_id }}</span>
                            <div>
                                <a>{{ data.user.card ? data.user.card : data.user.nickname }}</a>
                                <span :class="titleClass">
                                    <template v-if="data.user?.is_robot">
                                        {{ $t('机器人') }}
                                    </template>
                                    <template v-if="data.user?.role == 'owner'">
                                        {{ $t('群主') }}
                                    </template>
                                    <template v-if="data.user?.role == 'admin'">
                                        {{ $t('管理员') }}
                                    </template>
                                    <template v-if="data.user?.level">
                                        {{ 'Lv.' + data.user.level }}
                                    </template>
                                </span>
                                <span v-if="data.user?.is_robot" class="robot">{{ $t('机器人') }}</span>
                                <span v-if="data.user?.role == 'owner'" class="owner">{{ $t('群主') }}</span>
                                <span v-else-if="data.user?.role == 'admin'" class="admin">{{ $t('管理员') }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="member">
                        <div>
                            <template v-if="data.user.banTime">
                                <font-awesome-icon style="color: var(--color-red)" :icon="['fas', 'fa-volume-mute']" />
                                {{ $t('禁言中') }}
                            </template>
                        </div>
                        <span v-if="data.user.join_time">
                            {{
                                $t('{time} 加入群聊', {
                                    time: Intl.DateTimeFormat(getTrueLang(), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    }).format(
                                        new Date(data.user.join_time * 1000),
                                    ),
                                })
                            }}
                        </span>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { getTrueLang } from '@renderer/function/utils/systemUtil';
import {
    ref,
    type Ref,
    watchEffect,
    reactive,
    Reactive,
    computed,
} from 'vue';

const { data } = defineProps<{
    data: {
        x: number,
        y: number,
        user: IUser|number,
    }
}>()

const body: Ref<HTMLElement|undefined> = ref(undefined)
const posInfo: Reactive<{'--x': string, '--y': string, '--width': string}> = reactive({
    '--x': '0px',
    '--y': '0px',
    '--width': '0px',
})

const titleClass = computed(()=>{
    return {
        'user-title': true,
        'robot': data.user?.is_robot,
        'owner': data.user?.role == 'owner',
        'admin': data.user?.role == 'admin',
    }
})

// 切换css
watchEffect(() => {
    posInfo['--x'] = data.x + 'px'
    posInfo['--y'] = data.y + 'px'
    if (body.value) {
        posInfo['--width'] = body.value.offsetWidth + 'px'
    }

    // 出界处理
    if (!body.value) return
    // 高度
    const panHeight = body.value.clientHeight
    const bodyHeight = document.body.clientHeight
    if (data.y + panHeight > bodyHeight - 20) {
        posInfo['--y'] =
            bodyHeight - panHeight - 10 + 'px'
    }
    // 宽度
    const menuWidth = body.value.clientWidth
    const bodyWidth = document.body.clientWidth
    if (data.x + menuWidth > bodyWidth - 20) {
        posInfo['--x'] =
            bodyWidth - menuWidth - 10 + 'px'
    }
})
</script>

<script lang="ts">
type IUser = any
export interface UserInfoPan {
    open: (user: IUser | number, x: number, y: number) => void
    close: () => void
}
</script>

<style scoped>
.member-info {
    margin-left: var(--x);
    margin-top: var(--y);
}
.member-info-enter-active, .member-info-leave-active {
    animation: none 0.2s;
}
.member-info-enter-active > .ss-card, .member-info-leave-active > .ss-card {
    transition: all 0.2s;
}
.member-info-enter-active > .ss-card, .member-info-leave-active > .ss-card {
    transform-origin: top;
}
.member-info-enter-from > .ss-card, .member-info-leave-to > .ss-card {
    opacity: 0;
    transform: scaleY(0) translate(-20px, calc(-100% - 0.8rem));
}
.member-info-enter-to > .ss-card, .member-info-leave-from > .ss-card {
    opacity: 1;
    transform: scaleY(1) translate(-20px, calc(-100% - 0.8rem));
}
</style>
