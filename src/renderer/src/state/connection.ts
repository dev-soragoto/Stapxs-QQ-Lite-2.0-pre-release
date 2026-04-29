import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConnectionStore = defineStore('connection', () => {
    const heartbeatTime = ref<number>(-1)
    const oldHeartbeatTime = ref<number>(-1)
    const lastHeartbeatTime = ref<number>(-1)
    const backTimes = ref(0)

    return {
        heartbeatTime,
        oldHeartbeatTime,
        lastHeartbeatTime,
        backTimes,
    }
})
