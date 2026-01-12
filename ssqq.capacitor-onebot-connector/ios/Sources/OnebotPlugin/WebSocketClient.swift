//
//  WebsocketService.swift
//  Pods
//
//  Created by 林小槐 on 2024/12/12.
//

import Foundation
import os

@available(iOS 14.0, *)
class WebSocketClient: NSObject, URLSessionDelegate {
    var onEvent: ((String, String) -> Void)

    private let logger = Logger()

    private var webSocketTask: URLSessionWebSocketTask?
    private let urlSession: URLSession
    private let url: URL
    private var isConnected = false
    private var isInBackground = false
    private var heartbeatTimer: Timer?

    private var address: String
    private var token: String?

    // 重试相关
    private var retryAttempts = 0
    private let maxRetryAttempts = 4
    private let retryDelay: TimeInterval = 5.0

    init(url: URL, onEvent: @escaping (String, String) -> Void) {
        self.url = url
        self.onEvent = onEvent
        // 这儿需将 address 和 token 拆开; token 的部分不一定有
        // ws://192.168.99.100:3001/?token=123456
        self.address = self.url.absoluteString
        if let urlComponents = URLComponents(url: self.url, resolvingAgainstBaseURL: false) {
            self.token = urlComponents.queryItems?.first(where: { $0.name == "token" })?.value
        }

        // 配置 URLSession 以支持后台模式
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 300 // 5分钟超时
        configuration.timeoutIntervalForResource = 600 // 10分钟资源超时
        configuration.waitsForConnectivity = true // 等待网络连接

        self.urlSession = URLSession(configuration: configuration, delegate: nil, delegateQueue: OperationQueue())
        super.init()

        // 监听应用生命周期事件
        setupLifecycleObservers()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        stopHeartbeat()
    }

    // MARK: - Lifecycle Observers

    private func setupLifecycleObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppDidEnterBackground),
            name: Notification.Name("appDidEnterBackground"),
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppWillEnterForeground),
            name: Notification.Name("appWillEnterForeground"),
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleBackgroundRefresh),
            name: Notification.Name("backgroundRefresh"),
            object: nil
        )
    }

    @objc private func handleAppDidEnterBackground() {
        logger.info("应用进入后台，调整连接策略")
        isInBackground = true
        // 在后台模式下增加心跳间隔
        startHeartbeat(interval: 60.0) // 每60秒发送一次心跳
    }

    @objc private func handleAppWillEnterForeground() {
        logger.info("应用进入前台，恢复正常连接")
        isInBackground = false
        // 恢复正常心跳间隔
        startHeartbeat(interval: 30.0) // 每30秒发送一次心跳

        // 检查连接状态
        if !isConnected {
            logger.info("前台检测到未连接，尝试重连")
            connect()
        }
    }

    @objc private func handleBackgroundRefresh() {
        logger.info("后台刷新触发，发送心跳")
        sendHeartbeat()
    }

    // MARK: - Heartbeat

    private func startHeartbeat(interval: TimeInterval = 30.0) {
        stopHeartbeat()

        DispatchQueue.main.async { [weak self] in
            self?.heartbeatTimer = Timer.scheduledTimer(
                withTimeInterval: interval,
                repeats: true
            ) { [weak self] _ in
                self?.sendHeartbeat()
            }
        }
    }

    private func stopHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
    }

    private func sendHeartbeat() {
        guard isConnected else { return }

        webSocketTask?.sendPing { [weak self] error in
            if let error = error {
                self?.logger.error("心跳发送失败: \(error.localizedDescription)")
                // 心跳失败，可能需要重连
                if self?.isInBackground == false {
                    self?.logger.info("心跳失败，尝试重连")
                    self?.isConnected = false
                    self?.connect()
                }
            } else {
                self?.logger.debug("心跳发送成功")
            }
        }
    }

    func connect() {
        logger.info("尝试连接到：\(self.url)")
        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        receiveMessage()

        // 检查连接状态
        webSocketTask?.sendPing { [weak self] error in
            guard let self = self else { return }

            if error == nil {
                self.logger.info("连接成功")
                retryAttempts = 0
                // 拼为 json 字符串
                let data = try! JSONSerialization.data(
                    withJSONObject: ["address": self.address, "token": self.token], options: [])
                self.onEvent("onopen", String(data: data, encoding: .utf8)!)

                // 启动心跳
                self.startHeartbeat(interval: self.isInBackground ? 60.0 : 30.0)
            }
        }
    }

    func sendMessage(_ message: String) {
        guard isConnected else {
            logger.warning("WebSocket 未连接，无法发送消息")
            return
        }
        let message = URLSessionWebSocketTask.Message.string(message)
        webSocketTask?.send(message) { [weak self] error in
            if let error = error {
                self?.logger.error("发送消息失败: \(error.localizedDescription)")
            }
        }
    }

    func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.onEvent("onmessage", text)
                case .data(_):
                    logger.warning("收到二进制消息。")
                @unknown default:
                    logger.warning("收到未知类型的消息。")
                }
                self.receiveMessage() // 继续接收消息
            case .failure(let error):
                print("接收消息失败: \(error.localizedDescription)")
                self.handleConnectionFailure(error)
            }
        }
    }

    func disconnect() {
        logger.info("主动断开连接")
        isConnected = false
        stopHeartbeat()
        // 正常关闭（1000）
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
    }

    private func handleConnectionFailure(_ error: Error) {
        let code = webSocketTask?.closeCode.rawValue ?? -1

        logger.error("连接失败（\(code)）: \(error.localizedDescription)")
        isConnected = false
        stopHeartbeat()

        if code != 1005 && code != 1015 {
            let data = try! JSONSerialization.data(
                        withJSONObject: [
                            "code": code,
                            "message": error.localizedDescription,
                            "address": self.address,
                            "token": self.token as Any
                        ], options: [])
            self.onEvent("onclose", String(data: data, encoding: .utf8)!)
        } else {
            let data = try! JSONSerialization.data(
                        withJSONObject: [
                            "code": -1,
                            "message": error.localizedDescription,
                            "address": self.address,
                            "token": self.token as Any
                        ], options: [])
            self.onEvent("onclose", String(data: data, encoding: .utf8)!)
        }

        // 根据应用状态决定是否重连
        if code != 1000 && !isInBackground {
            // 仅在前台时主动重连
            if retryAttempts < maxRetryAttempts {
                retryAttempts += 1
                logger.info("重试连接 (\(self.retryAttempts)/\(self.maxRetryAttempts))...")
                DispatchQueue.global().asyncAfter(deadline: .now() + retryDelay) { [weak self] in
                    self?.connect()
                }
            } else {
                logger.error("达到最大重试次数，放弃连接")
            }
        } else if isInBackground {
            logger.info("后台模式下连接失败，等待前台时重连")
        }
    }
}
