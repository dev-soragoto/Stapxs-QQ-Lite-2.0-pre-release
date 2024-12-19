export interface OnebotPlugin {
    connect(options: { url: string }): Promise<{ success: boolean }>;
    close(): Promise<{ success: boolean }>;
    send(options: { data: string }): Promise<{ success: boolean }>;

    findService(): Promise<{ success: boolean }>;
}
