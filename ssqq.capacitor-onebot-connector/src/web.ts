import { WebPlugin } from '@capacitor/core';

import type { OnebotPlugin } from './definitions';

export class OnebotWeb extends WebPlugin implements OnebotPlugin {
    async connect(_: { url: string; }): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async send(_: { data: string; }): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async close(): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async findService(): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }
}
