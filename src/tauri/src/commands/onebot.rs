use log::info;
use tauri::{command, Emitter};
use once_cell::sync::Lazy;
use tungstenite::protocol::frame::coding::CloseCode;
use crate::commands::utils::websocket_client::WebSocketClient;
use std::{collections::HashMap, sync::Mutex};

// 全局可变 WebSocketClient
static WS_CLIENT: Lazy<Mutex<Option<WebSocketClient>>> = Lazy::new(|| Mutex::new(None));

#[command]
pub async fn onebot_connect(app_handle: tauri::AppHandle, address: &str, token: &str) -> Result<(), String> {
    info!("正在连接到: {}", address);
    // 创建 WebSocketClient
    let address = address.to_string();
    let token = token.to_string();
    let url = format!("{}?access_token={}", address, token);
    let app_handle1 = app_handle.clone();
    let app_handle2 = app_handle.clone();
    let app_handle3 = app_handle.clone();
    let ws_client = WebSocketClient::create(&url,
        move || {
            info!("已成功连接");
            let mut payload = HashMap::new();
            payload.insert("address", address.clone());
            payload.insert("token", token.clone());
            app_handle1.emit("onebot:onopen", payload).unwrap();
        },
        move |msg| { app_handle2.emit("onebot:onmessage", msg).unwrap(); },
        move |code: CloseCode, _| {
            app_handle3.emit("onebot:onclose", "").unwrap();
            info!("连接已关闭，代码：{}", code);
         }
    ).await.map_err(|e| e.to_string())?;

    // 将 WebSocketClient 存储到全局变量中
    let mut client = WS_CLIENT.lock().unwrap();
    *client = Some(ws_client);

    Ok(())
}

#[command]
pub fn onebot_send(data: &str) -> Result<(), String> {
    // 获取 WebSocketClient
    let client = WS_CLIENT.lock().unwrap();
    if let Some(ws_client) = &*client {
        ws_client.send(data).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("WebSocketClient not initialized".to_string())
    }
}

#[command]
pub fn onebot_close() -> Result<(), String> {
    // 获取 WebSocketClient
    let mut client = WS_CLIENT.lock().unwrap();
    if let Some(ws_client) = &*client {
        ws_client.close().map_err(|e| e.to_string())?;
        *client = None;
        Ok(())
    } else {
        Err("WebSocketClient not initialized".to_string())
    }
}
