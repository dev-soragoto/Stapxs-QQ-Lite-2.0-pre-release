<template>
    <div class="umami-info-pan">
        <div class="type-list">
            <font-awesome-icon :icon="['fas', 'book']" />
            <!-- 概览 -->
            <font-awesome-icon
                :class="{'select': showName === 'overview'}"
                :icon="['fas', 'chart-column']"
                @click="changeView('overview')" />
            <!-- 访客数据 -->
            <font-awesome-icon
                :class="{'select': showName === 'website'}"
                :icon="['fas', 'globe']"
                @click="changeView('website')" />
            <!-- 访客详情 -->
            <font-awesome-icon
                :class="{'select': showName === 'session'}"
                :icon="['fas', 'box-archive']"
                @click="changeView('session')" />
            <!-- 事件详情 -->
            <font-awesome-icon
                :class="{'select': showName === 'event'}"
                :icon="['fas', 'calendar-days']"
                @click="changeView('event')" />
        </div>
        <div v-if="showName != 'overview'" class="detail-list">
            <template v-if="showName === 'website'">
                <span>{{ $t('访客数据') }}</span>
            </template>
            <template v-if="showName === 'session'">
                <span>{{ $t('访客详情') }}</span>
                <a> {{ $t('访客数据表示访问网站的独立会话，同一个访客只会统计一次。并且在下次访问时覆盖上次的数据。') }} </a>
            </template>
            <template v-if="showName === 'event'">
                <span>{{ $t('事件详情') }}</span>
                <a> {{ $t('事件数据表示用户在访问期间的具体操作或上报行为，每次触发都会单独记录，因此同一个访客可能产生多个事件。') }} </a>
            </template>
            <div class="list">
                <div v-for="(item, index) in mainList"
                    :key="index"
                    :class="{'select': mainListSelected === item.value}"
                    @click="getData(item.value)">
                    <span>{{ item.label }}<span v-if="item.subLabel">{{ item.subLabel }}</span></span>
                    <a>{{ item.count ? formatNumber(Number(item.count)) : '' }}</a>
                </div>
            </div>
            <div class="time-select">
                <select v-model="timeType" @change="updateData">
                    <option value="1">
                        {{ $t('最近 24 小时') }}
                    </option>
                    <option value="2">
                        {{ $t('本周') }}
                    </option>
                    <option value="3">
                        {{ $t('本月') }}
                    </option>
                    <option value="4">
                        {{ $t('本年') }}
                    </option>
                    <option value="5">
                        {{ $t('所有时间段') }}
                    </option>
                </select>
            </div>
        </div>
        <div class="view-pan">
            <!-- 概览 -->
            <template v-if="showName === 'overview'">
                <a v-if="visitData.pageviewChart != null">{{ $t('概览') }}</a>
                <div v-if="visitData.pageviewChart != null" style="width: 100%;height: 100%;display: flex;align-items: center;flex-direction: column;">
                    <v-chart :option="visitData.pageviewChart" style="width: 100%;height: 100%;" autoresize />
                    <div class="time-select overview-time-select">
                        <select v-model="timeType" @change="updateData">
                            <option value="1">
                                {{ $t('最近 24 小时') }}
                            </option>
                            <option value="2">
                                {{ $t('本周') }}
                            </option>
                            <option value="3">
                                {{ $t('本月') }}
                            </option>
                            <option value="4">
                                {{ $t('本年') }}
                            </option>
                            <option value="5">
                                {{ $t('所有时间段') }}
                            </option>
                        </select>
                    </div>
                </div>
            </template>
            <!-- 访客数据 -->
            <template v-else-if="showName === 'website'">
                <div class="status">
                    <div v-for="name in Object.keys(visitData.status)"
                        v-show="name !== 'bounces' && name !== 'totaltime'"
                        :key="name">
                        <a>{{ formatNumber(visitData.status[name].value) }}</a>
                        <span>{{ $t('访客数据_' + name) }}</span>
                    </div>
                </div>
                <span>{{ $t('当前在线人数') }}: {{ visitData.online }}</span>
                <div v-if="visitData.metrics != null" class="ss-card website-metric">
                    <div>
                        <span v-if="mainListSelected !== ''">{{ $t(metricTypes[mainListSelected]) }}</span>
                        <a style="width: calc(5rem + 20px);">{{ $t('数值（占比）') }}</a>
                    </div>
                    <div v-for="(metric, index) in visitData.metrics" :key="index">
                        <span v-if="mainListSelected === 'event'">
                            {{ eventTypes[metric.x] ? $t(eventTypes[metric.x]) + $t('次数') : metric.x }}
                        </span>
                        <span v-else>{{ (metric.x && metric.x != '') ? metric.x : '-' }}</span>
                        <div>
                            <a>{{ formatNumber(metric.y) }}</a>
                            <!-- 按百分比绘制背景 -->
                            <div :style="{background: `linear-gradient(to right, color-mix(in srgb, var(--color-main) 20%, transparent) ${metric.percentage}%, transparent ${metric.percentage}%)`}">
                                <span>{{ metric.percentage }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <!-- 访客详情 & 事件详情 -->
            <template v-if="showName === 'event' || showName === 'session'">
                <div v-if="eventData != null" class="pie-pan">
                    <v-chart :option="eventData" autoresize />
                    <a>{{ $t('占比小于 {per}% 的数据将不会展示在饼图中', { per: minPiePercentage * 100 }) }}</a>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'

    import { use } from 'echarts/core'
    import { PieChart, BarChart } from 'echarts/charts'
    import {
        LegendComponent,
        BrushComponent,
        ToolboxComponent,
        TooltipComponent,
        GridComponent
    } from 'echarts/components'
    import { CanvasRenderer } from 'echarts/renderers'

    import VChart from 'vue-echarts'

    use([
        TooltipComponent,
        LegendComponent,
        PieChart,
        CanvasRenderer,
        LegendComponent,
        BrushComponent,
        ToolboxComponent,
        TooltipComponent,
        BarChart,
        GridComponent
    ])

    const API_URL = 'https://api.stapxs.cn/ssqq/umami'

    export default defineComponent({
        name: 'UmamiInfoPan',
        components: {
            VChart
        },
        data() {
            return {
                metricTypes: {
                    'url': '页面',
                    'browser': '浏览器',
                    'os': '操作系统',
                    'device': '设备',
                    'language': '语言',
                    'screen': '屏幕',
                    'event': '事件'
                },
                eventTypes: {
                    'send_msg': '发送消息',
                    'link_view': '预览链接',
                    'connect': '连接',
                    'use_theme_color': '切换主题色',
                    'use_language': '切换语言',
                    'click_statistics': '触发按钮',
                    'use_chatview': '切换聊天面板样式',
                    'cilent': '上报客户端',
                    'show_qed': '触发彩蛋',

                    'app_version': '应用版本',
                    'os_version': '系统版本',
                    'bot_version': '机器人版本',
                    'os_arch': '系统架构',
                },
                minPiePercentage: 0.0084, // 饼图中最小显示百分比，低于该值的归为“其他”
                showName: 'website',
                timeType: 1,
                mainListSelected: '',
                mainList: [] as {
                    label: string,
                    subLabel?: string,
                    value: string,
                    count?: number,
                    data?: any
                }[],
                visitData: {
                    pageviews: null as any,
                    pageviewChart: null as any,
                    status: {} as any,
                    metrics: null as any,
                    online: 0
                },
                eventData: null as any,
            }
        },
        mounted() {
            this.updateData()
            this.$watch(this.showName, () => {
                this.updateData()
            })
        },
        methods: {
            changeView(view: string) {
                this.showName = view
                this.mainListSelected = ''
                this.visitData.metrics = null
                this.eventData = null
                this.updateData()
            },

            updateData() {
                this.getStatus()
                this.getOnlineCount()
                this.getList()
                if(this.mainListSelected != '' || this.showName === 'overview') {
                    this.getData(this.mainListSelected)
                }
            },

            getData(value: string) {
                // 获取 css 中的 var(--color-main)
                const colorMainRaw = getComputedStyle(document.documentElement).getPropertyValue('--color-main')
                const colorFont = getComputedStyle(document.documentElement).getPropertyValue('--color-font-1')
                const colorCard = getComputedStyle(document.documentElement).getPropertyValue('--color-card-1')

                this.mainListSelected = value
                if (this.showName === 'overview') {
                    this.getPageViews().then(() => {
                        if(!this.visitData.pageviews) return
                        const xAxisData: string[] = []
                        const data1: number[] = []
                        const data2: number[] = []
                        for (let i = 0; i < this.visitData.pageviews.pageviews.length; i++) {
                            const pageviews = this.visitData.pageviews.pageviews[i]
                            const sessions = this.visitData.pageviews.sessions[i]
                            // 2025-09-19 01:00:00
                            const format = this.getRealTimeRange().format
                            const formattedDate = this.formatDate(pageviews.x, format)
                            xAxisData.push(formattedDate)
                            data1.push(pageviews.y)
                            data2.push(sessions.y)
                        }
                        const colorMain = this.hexToRgb(colorMainRaw)
                        // 给 colorMain 加透明的
                        const colorMainWithAlpha = colorMain.replace(')', ', 0.5)').replace('rgb', 'rgba')
                        this.visitData.pageviewChart = {
                            textStyle: {
                                color: colorFont
                            },
                            legend: {
                                data: [this.$t('浏览量'), this.$t('访客')],
                                left: '10%',
                                textStyle: {
                                    color: colorFont
                                }
                            },
                            tooltip: {},
                            xAxis: {
                                data: xAxisData,
                                name: this.getRealTimeRange().formatName,
                                axisLine: { onZero: true },
                                axisLabel: {
                                    color: colorFont
                                },
                                splitLine: { show: false },
                                splitArea: { show: false },
                            },
                            yAxis: {
                                axisLabel: {
                                    color: colorFont
                                }
                            },
                            grid: {
                                bottom: 100,
                                left: 50,
                            },
                            series: [
                                {
                                    name: this.$t('浏览量'),
                                    type: 'bar',
                                    data: data1,
                                    barGap: '-100%',
                                    itemStyle: {
                                        color: colorMainWithAlpha,
                                        borderRadius: [7, 7, 0, 0]
                                    }
                                },
                                {
                                    name: this.$t('访客'),
                                    type: 'bar',
                                    data: data2,
                                    itemStyle: {
                                        color: colorMain,
                                        borderRadius: [7, 7, 0, 0]
                                    }
                                }
                            ]
                        }
                    })
                } else if (this.showName === 'website') {
                    this.getMetric(value)
                } else if (this.showName === 'event' || this.showName === 'session') {
                    const eventData = this.mainList.find(item => item.value === value)?.data
                    if (eventData) {
                        // eventData 格式：[{value: 'xxx', total: 123}, ...]
                        // 转换为饼图需要的格式
                        let pieData = eventData.map((item: any) => ({
                            value: item.total,
                            name: (item.value != '' && item.value != null) ? item.value : this.$t('（未知）')
                        }))
                        // 只取前 9 项，其他归为“其他”，如果恰巧有 10 项也不处理防止第 10 项变成“其他”
                        // if (pieData.length > 10) {
                        //     const topData = pieData.slice(0, 9)
                        //     const otherTotal = pieData.slice(9).reduce((sum: number, item: any) => sum + item.value, 0)
                        //     topData.push({ value: otherTotal, name: this.$t('其他') })
                        //     pieData = topData
                        // }
                        // 按 value 降序排列
                        pieData.sort((a: any, b: any) => b.value - a.value)
                        // 这边的颜色用 colorMainRaw 创建 10 级不同透明度的颜色，不需要转为 rgba，使用十六进制颜色
                        // const colors = [] as string[]
                        // for (let i = 10; i >= 1; i--) {
                        //     const alpha = Math.floor((i / 10) * 255).toString(16).padStart(2, '0')
                        //     colors.push(colorMainRaw + alpha)
                        // }
                        // 去除占比小于等于 0.84% 的
                        pieData = pieData.filter((item: any) => (item.value / pieData.reduce((sum: number, it: any) => sum + it.value, 0)) > this.minPiePercentage)
                        this.eventData = {
                            // colors: colors,
                            color: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'],
                            tooltip: {
                                formatter: (params: any) => {
                                    return `${params.marker} ${params.name}: ${params.value} (${params.percent}%)`
                                },
                                trigger: 'item',
                                backgroundColor: colorCard,
                                textStyle: {
                                    color: colorFont
                                },
                            },
                            legend: {
                                top: 'bottom',
                                left: 'center',
                                type: 'scroll',
                                textStyle: {
                                    color: colorFont
                                }
                            },
                            series: [
                                {
                                    type: 'pie',
                                    radius: ['40%', '70%'],
                                    center: ['50%', '55%'],
                                    avoidLabelOverlap: false,
                                    padAngle: 3,
                                    itemStyle: {
                                        borderRadius: 7
                                    },
                                    label: {
                                        show: false
                                    },
                                    emphasis: {
                                        label: {
                                            show: false
                                        }
                                    },
                                    labelLine: {
                                        show: false
                                    },
                                    data: pieData
                                }
                            ]
                        }
                    }
                }
            },

            async getPageViews() {
                const url = API_URL + '/pageviews/' + this.getRealTimeRange().precision + '/' + this.getRealTimeRange().time
                const res = await fetch(url)
                const data = await res.json()
                if(!data.error) {
                    this.visitData.pageviews = data
                }
            },


            /**
             * 获取当前在线人数
             */
            async getOnlineCount() {
                // 获取当前在线人数
                const url = API_URL + '/active'
                const res = await fetch(url)
                const data = await res.json()
                if(!data.error) {
                    this.visitData.online = data.x
                }
            },

            /**
             * 获取统计指标列表
             */
            async getList() {
                this.mainList = []
                if(this.showName == 'website') {
                    const list = [] as {
                        label: string,
                        subLabel?: string,
                        value: string,
                        count?: number,
                        data?: any
                    }[]
                    for(const type of Object.keys(this.metricTypes)) {
                        list.push({
                            label: this.$t(this.metricTypes[type]),
                            value: type,
                        })
                    }
                    if(this.showName == 'website')
                        this.mainList = list
                } else if(this.showName == 'event' || this.showName == 'session') {
                    let url = API_URL + '/events/' + this.getRealTimeRange().time
                    if(this.showName == 'session') {
                        url = API_URL + '/sessions/' + this.getRealTimeRange().time
                    }
                    const res = await fetch(url)
                    const data = await res.json()
                    if(!data.error) {
                        const list = [] as {
                            label: string,
                            subLabel?: string,
                            value: string,
                            count?: number,
                            data?: any
                        }[]
                        for(const item of data) {
                            if(!item.eventName) {
                                item.eventName = item.propertyName
                                delete item.propertyName
                            }
                            list.push({
                                label: this.eventTypes[item.eventName] ? this.$t(this.eventTypes[item.eventName]) : item.eventName,
                                subLabel: item.propertyName,
                                value: item.eventName + '/' + item.propertyName,
                                count: item.total,
                                data: item.details
                            })
                        }
                        // 根据 count 降序排列
                        list.sort((a, b) => (b.count || 0) - (a.count || 0))
                        if(this.showName == 'event' || this.showName == 'session')
                            this.mainList = list
                    }
                }
            },

            /**
             * 获取访客数据总览
             */
            async getStatus() {
                // 获取页面浏览量
                this.visitData.status = {
                    pageviews: {value: 0},
                    visitors: {value: 0},
                    visits: {value: 0}
                }
                const url = API_URL + '/status/' + this.getRealTimeRange().time
                const res = await fetch(url)
                const data = await res.json()
                if(!data.error) {
                    this.visitData.status = data
                }
            },

            /**
             * 获取指定指标的详细数据
             * @param name 指标名称
             */
            async getMetric(name: string) {
                // 获取指定指标的详细数据
                this.visitData.metrics = []
                const url = API_URL + '/metrics/' + name + '/' + this.getRealTimeRange().time
                const res = await fetch(url)
                const data = await res.json()
                if(!data.error) {
                    // 计算 data[*].y 的总和
                    let total = 0
                    for(const item of data) {
                        total += item.y
                    }
                    // 计算每一项的占比
                    for(const item of data) {
                        item.percentage = ((item.y / total) * 100).toFixed(0)
                    }
                    this.visitData.metrics = data
                }
            },

            // ========== 工具函数 ===========

            getRealTimeRange() {
                const now = new Date()
                switch (Number(this.timeType)) {
                    case 1: // 最近 24 小时
                        return {
                            time: Date.now() - 86400000 + '-' + Date.now(),
                            precision: 'hour',
                            format: 'HH',
                            formatName: this.$t('小时')
                        }
                    case 2: { // 本周
                        const day = now.getDay() || 7 // 周日为7
                        const startOfWeek = new Date(now)
                        startOfWeek.setHours(0, 0, 0, 0)
                        startOfWeek.setDate(now.getDate() - day + 1) // 周一
                        return {
                            time: startOfWeek.getTime() + '-' + now.getTime(),
                            precision: 'day',
                            format: 'MM-DD',
                            formatName: this.$t('天')
                        }
                    }
                    case 3: { // 本月
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                        return {
                            time: startOfMonth.getTime() + '-' + now.getTime(),
                            precision: 'day',
                            format: 'MM-DD',
                            formatName: this.$t('天')
                        }
                    }
                    case 4: { // 本年
                        const startOfYear = new Date(now.getFullYear(), 0, 1)
                        return {
                            time: startOfYear.getTime() + '-' + now.getTime(),
                            precision: 'month',
                            format: 'YYYY-MM',
                            formatName: this.$t('月')
                        }
                    }
                    case 5: { // 所有时间段
                        return {
                            time: '0000000000000-' + now.getTime(),
                            precision: 'month',
                            format: 'YYYY-MM',
                            formatName: this.$t('月')
                        }
                    }
                    default: // 默认最近 24 小时
                        return {
                            time: Date.now() - 86400000 + '-' + Date.now(),
                            precision: 'hour',
                            format: 'HH'
                        }
                }
            },

            formatNumber(num: number) {
                // 将大于 1000 的数字格式化为 1.2k 形式
                if(num >= 1000000) {
                    return (num / 1000000).toFixed(1) + 'M'
                } else if(num >= 1000) {
                    return (num / 1000).toFixed(1) + 'k'
                } else {
                    return num.toString()
                }
            },

            formatDate(dateStr: string, format: string): string {
                const date = new Date(dateStr)
                if (isNaN(date.getTime())) return ''

                const map: Record<string, string> = {
                    'YYYY': date.getFullYear().toString(),
                    'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
                    'DD': date.getDate().toString().padStart(2, '0'),
                    'HH': date.getHours().toString().padStart(2, '0'),
                    'mm': date.getMinutes().toString().padStart(2, '0'),
                    'ss': date.getSeconds().toString().padStart(2, '0')
                }

                return format.replace(/YYYY|MM|DD|HH|mm|ss/g, matched => map[matched])
            },

            hexToRgb(hex: string): string {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : ''
            },
        },
    })
</script>

<style scoped>
.umami-info-pan {
    margin:-41px -15px -15px -15px;
    padding: 0 !important;
    flex-direction: row;
    display: flex;
    height: calc(100% + 30px);
    background: var(--color-bg);
    border-radius: 7px;
    overflow: hidden;
    z-index: -1;
}
.type-list {
    background: var(--color-card-2);
    flex-direction: column;
    padding: 10px;
    display: flex;
    z-index: 10;
}
.type-list > svg {
    cursor: pointer;
    color: var(--color-font);
    width: 15px;
    height: 15px;
    padding: 10px;
    border-radius: 7px;
    margin-bottom: 10px;
}
.type-list > svg:first-child {
    width: 13px;
    height: 13px;
    border: 2px solid var(--color-main);
}
.type-list > svg.select {
    background: var(--color-main);
    color: var(--color-font-r);
}

.detail-list {
    background: var(--color-card-1);
    flex-direction: column;
    display: flex;
    width: 30%;
}
.detail-list > span {
    color: var(--color-font);
    font-size: 1rem;
    font-weight: bold;
    display: block;
    margin: 1rem;
}
.detail-list > a {
    border-radius: 7px;
    padding: 10px;
    background: var(--color-card-2);
    margin: 0 1rem 1rem 1rem;
    font-size: 0.8rem;
    color: var(--color-font-1);
}
.time-select {
    margin: 1rem;
}
.time-select > select {
    background: var(--color-card-1);
    color: var(--color-font);
    border: navajowhite;
    border-radius: 7px;
    width: 100%;
    height: 30px;
}
.overview-time-select {
    position: absolute;
    bottom: 17px;
    width: 150px;
    right: 80px;
}
.detail-list > .list {
    overflow-y: scroll;
    margin-right: 7px;
    flex: 1;
}

.detail-list > .list > div {
    justify-content: space-between;
    cursor: pointer;
    margin: 0 1rem 5px 1rem;
    flex-direction: row;
    border-radius: 7px;
    padding: 7px 10px;
    align-items: center;
    display: flex;
}
.detail-list > .list > div > span > span {
    display: block;
    font-size: 0.8rem;
    color: var(--color-font-2);
}
.detail-list > .list > div:hover {
    background: var(--color-card-2);
}
.detail-list > .list > div.select {
    background: var(--color-main);
    color: var(--color-font-r);
}
.detail-list > .list > div.select > span > span {
    color: var(--color-font-2-r);
}

.view-pan {
    justify-content: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    flex: 1;
}
.view-pan > span {
    display: block;
    width: fit-content;
    margin-bottom: 2rem;
    font-size: 0.75rem;
    background: var(--color-card-2);
    padding: 5px 15px 5px 25px;
    border-radius: 20px;
}
.view-pan > span::before {
    content: '';
    width: 0.75rem;
    height: 0.75rem;
    background: var(--color-green);
    position: absolute;
    border-radius: 100%;
    margin-top: 1px;
    margin-left: -17px;
}
.view-pan > a {
    display: block;
    width: 100%;
    color: var(--color-font);
    font-size: 1rem;
    font-weight: bold;
    display: block;
    margin: 0 1rem 1rem 1rem;
}

.pie-pan {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column-reverse;
}
.pie-pan > x-vue-echarts {
    width: 80%;
    margin-top: -15%;
}
.pie-pan > a {
    display: block;
    width: 80%;
    text-align: center;
    background: var(--color-card-1);
    padding: 10px;
    border-radius: 7px;
    font-size: 0.8rem;
    color: var(--color-font-2);
}

.status {
    margin-top: 1rem;
    padding-bottom: 1rem;
    flex-direction: column;
    width: calc(100% - 30px);
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    flex-wrap: wrap;
}
.status > div {
    flex-direction: column;
    align-items: center;
    display: flex;
    margin: 10px;
}
.status > div > a {
    font-weight: bold;
    font-size: 1.3rem;
}
.status > div > span {
    color: var(--color-font-2);
    font-size: 0.8rem;
}

.website-metric {
    border-top: 7px solid var(--color-main);
    margin-bottom: -20px;
    border-radius: 7px 7px 0 0;
    padding: 0;
    flex: 1;
    overflow-y: scroll;
    width: 100%;
}
.website-metric::-webkit-scrollbar {
    display: none;
}
.website-metric > div {
    justify-content: space-between;
    margin: 0 0 5px 0;
    flex-direction: row;
    border-bottom: 1px solid var(--color-border);
    padding: 7px 20px;
    display: flex;
}
.website-metric > div:nth-child(odd) {
    background: var(--color-card-1);
}
.website-metric > div:first-child {
    background: var(--color-card-2);
    font-weight: bold;
}
.website-metric > div > span {
    width: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.website-metric > div > div {
    display: flex;
    align-items: center;
    margin: -7px 0;
}
.website-metric > div > div > a {
    font-weight: bold;
}
.website-metric > div > div > div {
    height: 100%;
    margin: -10px 0;
    border-left: 1px solid var(--color-font-2);
    padding-left: 10px;
    margin-left: 10px;
    width: 3rem;
    display: flex;
    align-items: center;
}
.website-metric > div > div > div span {
    font-size: 0.8rem;
    color: var(--color-font-2);
}

@media (max-width: 500px) {
    .umami-info-pan {
        flex-direction: column !important;
        margin: -46px -20px -20px !important;
    }
    .type-list {
        flex-direction: row !important;
        padding-top: 40px !important;
        justify-content: space-evenly;
    }
    .type-list > svg:first-child {
        display: none !important;
    }
    .detail-list {
        max-height: 30%;
        width: 100% !important;
    }
    .view-pan {
        height: calc(70% - 140px);
    }
    .overview-time-select {
        right: 20px !important;
        width: 100px !important;
    }
}
</style>
