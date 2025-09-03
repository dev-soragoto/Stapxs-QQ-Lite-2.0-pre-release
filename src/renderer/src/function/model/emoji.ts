/*
 * @FileDescription: emoji 封装
 * @Author: Mr.Lee
 * @Date: 2025/08/30
 * @Version: 1.0
 */

import { Logger } from '../base'

export default class Emoji {
    static apngMap = new Map<number, {normal: string, super: string}>()
    /**
     * 全部表情id列表
     */
    static allList: Set<number> = new Set<number>()
    /**
     * 全部超级表情id列表
     */
    static allSuperList: Set<number> = new Set<number>()
    /**
     * 超级表情列表
     */
    static superList: readonly number[] = [
        5, 311, 312, 314, 317, 318, 319, 320, 324, 325, 337,
        338, 339, 341, 342, 343, 344, 345, 346, 181, 74, 75,
        351, 349, 350, 395, 114, 326, 53, 137, 333, 424, 415,
        392, 425, 427, 426, 419, 429
    ]
    /**
     * 小黄脸表情列表
     */
    static normalList: readonly number[] = [
        14, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 0, 15, 16,
        96, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
        31, 32, 33, 34, 35, 36, 37, 38, 39, 97, 98, 99, 100,
        101, 102, 103, 104, 105, 106, 107, 108, 305, 109, 110,
        111, 172, 182, 179, 173, 174, 212, 175, 178, 177, 176,
        183, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271,
        272, 277, 307, 306, 281, 282, 283, 284, 285, 293, 286,
        287, 289, 294, 297, 298, 299, 300, 323, 332, 336, 353,
        355, 356, 354, 352, 357, 428, 334, 347, 303, 302, 295,
        49, 66, 63, 64, 187, 146, 116, 67, 60, 185, 76, 124,
        118, 78, 119, 79, 120, 121, 77, 123, 201, 273, 46, 112,
        56, 169, 171, 59, 144, 147, 89, 41, 125, 42, 43, 86, 129,
        85
    ]
    /**
     * emoji表情列表
     */
    static emojiList: readonly number[] = [
        128522, 128524, 128538, 128531, 128560, 128541, 128513,
        128540, 9786, 128525,128532, 128516, 128527, 128530,
        128563, 128536, 128557, 128561, 128514, 128170,128074,
        128077, 128079, 128078, 128591, 128076, 128070, 128064,
        127836, 127847,127838, 127866, 127867, 9749, 127822,
        127827, 127817, 128684, 127801, 127881,128157, 128163,
        10024, 128168, 128166, 128293, 128164, 128169, 128137,
        128235,128014, 128103, 128102, 128053, 128055, 128046,
        128020, 128056, 128123, 128027,128054, 128051, 128098,
        9728, 10068, 128299, 128147, 127978
    ]
    /**
     * 回复表情 apng 列表
     */
    static responseApngId: readonly number[] = [
        5, 314, 318, 319, 320, 324, 337, 338, 339, 341, 342, 343, 344,
        345, 346, 181, 74, 75, 351, 349, 350, 395, 326, 53, 333, 424,
        425, 427, 426, 14, 4, 8, 9, 10, 12, 16, 96, 21, 23, 24, 25, 26,
        27, 28, 29, 30, 32, 33, 34, 38, 39, 97, 98, 99, 100, 101, 102,
        103, 104, 106, 305, 109, 111, 182, 179, 173, 174, 212, 175, 176,
        183, 262, 264, 265, 266, 267, 268, 269, 270, 271, 272, 277, 307,
        306, 281, 282, 284, 285, 293, 287, 289, 294, 297, 298, 299, 332,
        336, 353, 355, 356, 354, 352, 357, 428, 334, 347, 303, 302, 295,
        49, 66, 63, 116, 60, 76, 124, 118, 78, 79, 120, 123, 201, 273,
        171, 144, 147, 89, 41, 125, 42, 43, 129, 85,
    ]
    /**
     * 回复表情 emoji 列表
     */
    static responseEmojiId: readonly number[] = [
        128522, 128524, 128538, 128531, 128560, 128541, 128513, 128540,
        9786, 128532, 128516, 128527, 128530, 128563, 128536, 128557,
        128514, 128170, 128074, 128077, 128079, 128076, 127836, 127847,
        127838, 127866, 127867, 9749, 127822, 127827, 127817, 127801,
        127881, 128157, 10024, 128168, 128166, 128293, 128164, 128235,
        128103, 128102, 128053, 128046, 128027, 128051, 9728, 10068,
        128147
    ]
    private constructor(
        public value: string,
        public type: 'apng' | 'emoji',
        public superValue?: string
    ) {}

    /**
     * 根据 id 获取一个表情
     * @param id 表情id
     * @returns
     */
    static get(id: number): Emoji | undefined {
        if (id < 5000) {
            const value = this.apngMap.get(id)
            if (value) return new Emoji(value.normal, 'apng', value.super)
            else return undefined
        }else {
            return new Emoji(String.fromCodePoint(id), 'emoji')
        }
    }

    /**
     * 判断表情是否存在
     * @param id 表情id
     * @returns
     */
    static has(id: number): boolean {
        if (id < 5000)
            return this.apngMap.has(id)
        else
            return true
    }

    static init() {
        const pathList = import.meta.glob(
            '@renderer/assets/img/qq-face/public/assets/qq_emoji/resfile/emoji/*/apng/*.png',
            { eager: true }
        )
        const superList = import.meta.glob(
            '@renderer/assets/img/qq-face/public/assets/qq_emoji/resfile/emoji/*/lottie/*.json',
            { eager: true }
        )
        // 匹配普通表情
        for(const path in pathList) {
            const match = path.match(/\/(\d+)\.(png)$/)
            if (match) {
                const id = parseInt(match[1])
                this.apngMap.set(id, { normal: (pathList[path] as any).default, super: '' })
                this.allList.add(id)
            }
        }
        // 匹配超级表情
        for(const path in superList) {
            const match = path.match(/\/(\d+)\.(json)$/)
            if (match) {
                const id = parseInt(match[1])
                const emojiData = this.apngMap.get(id)
                if (!emojiData) continue
                emojiData.super = (superList[path] as any).default
                this.allSuperList.add(id)
            }
        }

        // 验证表情全面性
        const testList = [
            ...this.superList,
            ...this.normalList,
            ...this.responseApngId
        ]
        for (const id of testList) {
            if (!this.allList.has(id))
                new Logger().error(null, `Emoji not found: ${id}`)
        }
        for (const id of this.superList) {
            if (!this.allSuperList.has(id))
                new Logger().error(null, `Super Emoji not found: ${id}`)
        }
    }

    /**
     * 回应表情 id
     */
    static get responseId(): readonly number[] {
        return [...this.responseApngId, ...this.responseEmojiId]
    }
}

setTimeout(Emoji.init.bind(Emoji), 0)
