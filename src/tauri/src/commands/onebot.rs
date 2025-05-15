use log::{info, error};
use once_cell::sync::Lazy;
use std::{collections::HashMap, sync::Mutex};
use tauri::{command, AppHandle, Emitter};
use tungstenite::protocol::frame::coding::CloseCode;

use crate::commands::utils::websocket_client::WebSocketClient;

static WS_CLIENT: Lazy<Mutex<Option<WebSocketClient>>> = Lazy::new(|| Mutex::new(None));

#[command]
pub async fn onebot_connect(
    app_handle: AppHandle,
    address: &str,
    token: &str,
) -> Result<(), String> {
    {
        let client = WS_CLIENT.lock().unwrap();
        if client.is_some() {
            info!("已有连接，跳过创建");
            let mut payload = HashMap::new();
            payload.insert("address", address.to_string());
            payload.insert("token", token.to_string());
            app_handle.emit("onebot:onopen", payload).unwrap();
            return Ok(());
        }
    }

    info!("正在连接到: {}", address);
    let url = format!("{}?access_token={}", address, token);
    let address = address.to_string();
    let token = token.to_string();

    let app_handle_open = app_handle.clone();
    let app_handle_msg = app_handle.clone();
    let app_handle_close = app_handle.clone();

    let ws_client = WebSocketClient::create(
        &url,
        move || {
            info!("连接成功: {}", &address);
            let mut payload = HashMap::new();
            payload.insert("address", address.clone());
            payload.insert("token", token.clone());
            let _ = app_handle_open.emit("onebot:onopen", payload);
        },
        move |msg| {
            let _ = app_handle_msg.emit("onebot:onmessage", msg);
        },
        move |code: CloseCode, reason| {
            info!("连接已关闭：{} {:?}", code, reason);
            {
                let mut client = WS_CLIENT.lock().unwrap();
                *client = None;
            }
            let mut payload = HashMap::new();
            payload.insert("code", code.to_string());
            payload.insert("message", reason.to_string());
            let _ = app_handle_close.emit("onebot:onclose", payload);
        },
    )
    .await
    .map_err(|e| {
        error!("连接失败: {}", e);
        let mut payload = HashMap::new();
        payload.insert("code", 1000.to_string());
        payload.insert("message", e.to_string());
        let _ = app_handle.emit("onebot:onclose", payload);
        e.to_string()
    })?;

    let mut client = WS_CLIENT.lock().unwrap();
    *client = Some(ws_client);
    Ok(())
}

#[command]
pub fn onebot_send(data: &str) -> Result<(), String> {
    let client = WS_CLIENT.lock().unwrap();
    if let Some(ws_client) = &*client {
        ws_client.send(data).map_err(|e| e.to_string())
    } else {
        Err("WebSocketClient not initialized".to_string())
    }
}

#[command]
pub fn onebot_close(app_handle: AppHandle) -> Result<(), String> {
    let mut client = WS_CLIENT.lock().unwrap();
    if let Some(ws_client) = &*client {
        ws_client.close().map_err(|e| e.to_string())?;
        *client = None;

        info!("连接主动关闭");
        let mut payload = HashMap::new();
        payload.insert("code", 1000.to_string());
        payload.insert("message", "".to_string());
        let _ = app_handle.emit("onebot:onclose", payload);
        Ok(())
    } else {
        Err("WebSocketClient not initialized".to_string())
    }
}
