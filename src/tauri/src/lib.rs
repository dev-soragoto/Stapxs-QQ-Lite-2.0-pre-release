mod commands;

use commands::utils::http_proxy::ProxyServer;
use log::info;
use log4rs::{append::console::ConsoleAppender, config::{Appender, Root}, Config};
use once_cell::sync::OnceCell;
use tauri::{ TitleBarStyle, WebviewUrl, WebviewWindowBuilder };
use tauri::window::{ Effect, EffectsBuilder, Color };
use tauri_plugin_store::StoreBuilder;

pub static PROXY_PORT: OnceCell<u16> = OnceCell::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// Tauri 应用程序入口
pub fn run() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let proxy = rt.block_on(async {
        let proxy = ProxyServer::new().await;
        proxy
    });
    PROXY_PORT.set(proxy.port).unwrap();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let store =
                StoreBuilder::new(app, ".settings.dat").build().map_err(|e| e.to_string())?;
            let log_level = store.get("log_level").unwrap_or_default();
            let final_log_level = match log_level.as_str() {
                Some("err") => log::LevelFilter::Error,
                Some("debug") => log::LevelFilter::Debug,
                Some("info") => log::LevelFilter::Info,
                Some("all") => log::LevelFilter::Info,
                _ => log::LevelFilter::Info,
            };
            // 初始化 log4rs
            let stdout = ConsoleAppender::builder()
                .encoder(Box::new(commands::utils::colored_encoder::ColoredPrefixEncoder))
                .build();
            let config = Config::builder()
                .appender(Appender::builder().build("stdout", Box::new(stdout)))
                .build(
                    Root::builder()
                        .appender("stdout")
                        .build(final_log_level),
                )
                .unwrap();

            log4rs::init_config(config).unwrap();

            println!("");
            println!(" _____ _____ _____ _____ __ __ ");
            println!("|   __|_   _|  _  |  _  |  |  |");
            println!("|__   | | | |     |   __|-   -|");
            println!("|_____| |_| |__|__|__|  |__|__| CopyRight © Stapx Steve");
            println!("=======================================================");
            println!("日志等级:{}", log_level);

            if PROXY_PORT.get().is_some() {
                info!("代理服务器已启动，端口：{}", PROXY_PORT.get().unwrap());
            }

            info!("欢迎使用 Stapxs QQ Lite, 当前版本: {}", env!("CARGO_PKG_VERSION"));
            info!("启动平台架构：{}", std::env::consts::OS);
            info!("正在创建窗体 ……");
            create_window(app)?;
            info!("窗体创建成功");
            Ok(())
        })
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::sys::sys_get_platform,
            commands::sys::sys_get_release,
            commands::sys::sys_create_menu,
            commands::sys::sys_update_menu,
            commands::sys::sys_run_proxy,
            commands::sys::sys_send_notice,
            commands::sys::sys_open_in_browser,
            commands::sys::sys_run_command,
            commands::onebot::onebot_connect,
            commands::onebot::onebot_send,
            commands::onebot::onebot_close,
            commands::win::win_close,
            commands::win::win_minimize,
            commands::win::win_maximize,
            commands::win::win_always_top,
            commands::win::win_get_window_info,
            commands::win::win_move,
            commands::win::win_open_dev_tools,
            commands::opt::opt_get_system_info,
            commands::opt::opt_store,
            commands::opt::opt_save_all,
            commands::opt::opt_get_all,
            commands::opt::opt_get,
            commands::opt::opt_clear_all,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 创建主窗体配置
fn create_window(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("/".into()))
        .title("Stapxs QQ Lite")
        .inner_size(850.0, 530.0)
        .transparent(true);
    #[cfg(target_os = "macos")]
    let win_builder = win_builder
        .title_bar_style(TitleBarStyle::Overlay)
        .hidden_title(true)
        .background_color(Color(0, 0, 0, 1))
        .effects(EffectsBuilder::new()
            .effects(vec![Effect::Sidebar])
            .build());
    let window = win_builder.build()?;
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }
    // #[cfg(target_os = "windows")]
    // apply_blur(&window, Some((18, 18, 18, 125)))
    //     .expect("Unsupported platform! 'apply_blur' is only supported on Windows");
    Ok(())
}
