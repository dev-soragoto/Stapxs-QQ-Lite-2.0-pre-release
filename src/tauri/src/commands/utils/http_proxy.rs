use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;

use reqwest::Client;
use warp::reply::Reply;
use warp::Filter;

const START_PORT: u16 = 5001;
const MAX_PORT: u16 = 5100;

pub struct ProxyServer {
    pub port: u16
}

impl ProxyServer {
    pub async fn new() -> Self {
        let client = Client::new();

        let proxy_filter = warp::path("proxy")
            .and(warp::query::<HashMap<String, String>>())
            .and_then(move |params: HashMap<String, String>| {
                let client = client.clone();
                async move {
                    if let Some(target_url) = params.get("url") {
                        match client.get(target_url).send().await {
                            Ok(response) => {
                                let mut res = warp::http::Response::builder()
                                    .status(warp::http::StatusCode::from_u16(response.status().as_u16()).unwrap());

                                let body = response.bytes().await.unwrap_or_default();

                                res = res
                                    .header("Access-Control-Allow-Origin", "*")
                                    .header("X-Frame-Options", "")
                                    .header("Content-Type", "text/html; charset=utf-8");

                                Ok::<_, Infallible>(res.body(body).into_response())
                            }
                            Err(_) => Ok::<_, Infallible>(
                                warp::reply::with_status("Fetch error", warp::http::StatusCode::BAD_GATEWAY)
                                    .into_response(),
                            ),
                        }
                    } else {
                        Ok::<_, Infallible>(
                            warp::reply::with_status("未知的 URL", warp::http::StatusCode::BAD_REQUEST)
                                .into_response(),
                        )
                    }
                }
            });

        let mut port = START_PORT;

        loop {
            let addr: SocketAddr = ([127, 0, 0, 1], port).into();

            match warp::serve(proxy_filter.clone()).try_bind_ephemeral(addr) {
                Ok((_, server)) => {
                    tokio::spawn(server);
                    return Self { port };
                }
                Err(_) => {
                    port += 1;
                    if port > MAX_PORT {
                        panic!("❌ 本地反代服务无法绑定 {}-{}", START_PORT, MAX_PORT);
                    }
                }
            }
        }
    }
}
