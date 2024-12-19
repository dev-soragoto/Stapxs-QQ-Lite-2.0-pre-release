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
        let configuration = URLSessionConfiguration.default
        self.urlSession = URLSession(configuration: configuration, delegate: nil, delegateQueue: OperationQueue())
        super.init()
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
            }
        }
    }

    func sendMessage(_ message: String) {
        guard isConnected else { return }
        let message = URLSessionWebSocketTask.Message.string(message)
        webSocketTask?.send(message) { error in
            if let error = error {
                print("发送消息失败: \(error.localizedDescription)")
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
        isConnected = false
        // 正常关闭（1000）
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
    }

    private func handleConnectionFailure(_ error: Error) {
        let code = webSocketTask?.closeCode.rawValue ?? -1

        print("连接失败（\(code)）: \(error.localizedDescription)")
        isConnected = false

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

        if code != 1000 {
            // 尝试重连
            if retryAttempts < maxRetryAttempts {
                retryAttempts += 1
                print("重试连接 (\(retryAttempts)/\(maxRetryAttempts))...")
                DispatchQueue.global().asyncAfter(deadline: .now() + retryDelay) { [weak self] in
                    self?.connect()
                }
            } else {
                print("达到最大重试次数，放弃连接")
            }
        }
    }
}
