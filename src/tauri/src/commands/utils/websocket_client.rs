use futures_util::{StreamExt, SinkExt};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex
};
use tokio::sync::mpsc;
use tokio_tungstenite::connect_async;
use tungstenite::{
    protocol::{frame::coding::CloseCode, CloseFrame, Message},
    Utf8Bytes,
};

pub struct WebSocketClient {
    sender: mpsc::UnboundedSender<Message>,
    is_active: Arc<AtomicBool>,
}

impl WebSocketClient {
    pub async fn create<F1, F2, F3>(
        url: &str,
        on_open: F1,
        on_message: F2,
        on_close: F3,
    ) -> anyhow::Result<Self>
    where
        F1: FnMut() + Send + 'static,
        F2: FnMut(String) + Send + 'static,
        F3: FnMut(CloseCode, Utf8Bytes) + Send + 'static,
    {
        let on_open = Arc::new(Mutex::new(on_open));
        let on_message = Arc::new(Mutex::new(on_message));
        let on_close = Arc::new(Mutex::new(on_close));

        let (ws_stream, _) = connect_async(url).await?;
        let (mut write, mut read) = ws_stream.split();
        let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

        let is_active = Arc::new(AtomicBool::new(true));

        let is_active_send = is_active.clone();
        let is_active_recv = is_active.clone();

        let on_message_cloned = on_message.clone();
        let on_close_send = on_close.clone();
        let on_close_recv = on_close.clone();

        // 发送任务
        tokio::spawn(async move {
            {
                let mut cb = on_open.lock().unwrap();
                cb();
            }

            while let Some(msg) = rx.recv().await {
                if write.send(msg).await.is_err() {
                    if is_active_send.swap(false, Ordering::SeqCst) {
                        let mut cb = on_close_send.lock().unwrap();
                        cb(CloseCode::Abnormal, Utf8Bytes::from("send failed"));
                    }
                    break;
                }
            }
        });

        // 接收任务
        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        if is_active_recv.load(Ordering::SeqCst) {
                            let mut cb = on_message_cloned.lock().unwrap();
                            cb(text.to_string());
                        }
                    }
                    Ok(Message::Close(Some(frame))) => {
                        if is_active_recv.swap(false, Ordering::SeqCst) {
                            let mut cb = on_close_recv.lock().unwrap();
                            cb(frame.code, frame.reason);
                        }
                        break;
                    }
                    Ok(Message::Close(None)) => {
                        if is_active_recv.swap(false, Ordering::SeqCst) {
                            let mut cb = on_close_recv.lock().unwrap();
                            cb(CloseCode::Normal, Utf8Bytes::from(""));
                        }
                        break;
                    }
                    Err(e) => {
                        eprintln!("WebSocket error: {:?}", e);
                        if is_active_recv.swap(false, Ordering::SeqCst) {
                            let mut cb = on_close_recv.lock().unwrap();
                            cb(CloseCode::Abnormal, Utf8Bytes::from("read error"));
                        }
                        break;
                    }
                    _ => {}
                }
            }
        });

        Ok(Self {
            sender: tx,
            is_active,
        })
    }

    pub fn send(&self, text: &str) -> anyhow::Result<()> {
        if !self.is_active.load(Ordering::SeqCst) {
            anyhow::bail!("WebSocket is closed");
        }
        self.sender.send(Message::Text(text.into()))?;
        Ok(())
    }

    pub fn close(&self) -> anyhow::Result<()> {
        if self.is_active.swap(false, Ordering::SeqCst) {
            self.sender.send(Message::Close(Some(CloseFrame {
                code: CloseCode::Normal,
                reason: Utf8Bytes::from("client closed"),
            })))?;
        }
        Ok(())
    }
}
