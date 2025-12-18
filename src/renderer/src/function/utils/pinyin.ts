export type PinYinData = {
    main: string[]
    short: string[]
}

/* eslint-disable no-console */

// 拼音库加载状态
let pinyinLoaded = false
let pinyinLoading = false

// 动态加载拼音库
async function loadPinyinLibrary(): Promise<boolean> {
    if (pinyinLoaded) return true
    if (pinyinLoading) {
        // 等待其他加载完成
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (!pinyinLoading) {
                    clearInterval(checkInterval)
                    resolve(pinyinLoaded)
                }
            }, 100)
            // 最多等待 5 秒
            setTimeout(() => {
                clearInterval(checkInterval)
                resolve(false)
            }, 5000)
        })
        return pinyinLoaded
    }

    pinyinLoading = true

    try {
        // 创建 script 标签动态加载
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://lib.stapxs.cn/modules/pinyin.min.js'
            script.async = true

            // 设置 5 秒超时
            const timeout = setTimeout(() => {
                script.remove()
                reject(new Error('拼音库加载超时'))
            }, 5000)

            script.onload = () => {
                clearTimeout(timeout)
                pinyinLoaded = true
                resolve()
            }

            script.onerror = () => {
                clearTimeout(timeout)
                script.remove()
                reject(new Error('拼音库加载失败'))
            }

            document.head.appendChild(script)
        })

        console.log('拼音库加载成功')
        return true
    } catch (error) {
        console.warn('拼音库加载失败，拼音搜索功能将不可用:', error)
        return false
    } finally {
        pinyinLoading = false
    }
}

// 预加载拼音库（应用启动时调用，失败不阻塞）
export function preloadPinyin(): void {
    loadPinyinLibrary().catch(() => {
        // 静默处理，不影响应用启动
    })
}

export function getPinyin(name: string): PinYinData {
    // 如果拼音库未加载，返回空数据
    if (!pinyinLoaded || typeof window === 'undefined' || !(window as any).pinyin) {
        return {
            main: [],
            short: []
        }
    }

    try {
        const pinyinLib = (window as any).pinyin
        return {
            main: pinyinLib.pinyin(name, {
                heteronym: true,
                compact: true,
                style: 'normal',
            }).map((item: string[]) => item.join('').toLowerCase()),
            short: pinyinLib.pinyin(name, {
                heteronym: true,
                compact: true,
                style: 'first_letter',
            }).map((item: string[]) => item.join('').toLowerCase()),
        }
    } catch (error) {
        console.warn('拼音转换失败:', error)
        return {
            main: [],
            short: []
        }
    }
}

export function matchPinyin(
    pinyinData: PinYinData,
    matchStr: string
): boolean {
    const str = matchStr.toLowerCase()
    for (const py of pinyinData.main) {
        if (py.includes(str)) return true
    }
    for (const pyShort of pinyinData.short) {
        if (pyShort.includes(str)) return true
    }
    return false
}
