use futures_util::{StreamExt, SinkExt};
use tokio::sync::mpsc;
use tokio_tungstenite::connect_async;
use tungstenite::protocol::Message;

pub struct WebSocketClient {
    sender: mpsc::UnboundedSender<Message>,
}

impl WebSocketClient {
    pub async fn create<F1, F2, F3>(url: &str, mut on_open: F1, mut on_message: F2, mut on_close: F3) -> anyhow::Result<Self>
    where
        F1: FnMut() + Send + 'static,
        F2: FnMut(String) + Send + 'static,
        F3: FnMut() + Send + 'static,
    {
        let (ws_stream, _) = connect_async(url).await?;

        on_open();

        let (mut write, mut read) = ws_stream.split();
        let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

        // 发送任务
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if write.send(msg).await.is_err() {
                    break;
                }
            }
        });

        // 接收任务
        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        on_message(text.to_string());
                    }
                    // Ok(Message::Binary(bin)) => {
                    //     on_message(format!("[binary] {:?}", bin));
                    // }
                    Ok(Message::Close(_)) => {
                        // 收到 Close，触发 on_close
                        on_close();
                        break;
                    }
                    Ok(_) => {}
                    Err(e) => {
                        eprintln!("WebSocket error: {:?}", e);
                        on_close();
                        break;
                    }
                }
            }
        });

        Ok(Self { sender: tx })
    }

    pub fn send(&self, text: &str) -> anyhow::Result<()> {
        self.sender.send(Message::Text(text.into()))?;
        Ok(())
    }

    pub fn close(&self) -> anyhow::Result<()> {
        self.sender.send(Message::Close(None))?;
        Ok(())
    }
}
