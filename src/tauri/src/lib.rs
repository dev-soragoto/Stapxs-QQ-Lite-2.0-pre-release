mod commands;

use tauri::{ TitleBarStyle, WebviewUrl, WebviewWindowBuilder };
use tauri::window::{ Effect, EffectsBuilder, Color };

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// Tauri 应用程序入口
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            create_window(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::sys::sys_get_platform,
            commands::sys::sys_get_release,
            commands::onebot::onebot_connect,
            commands::onebot::onebot_send,
            commands::onebot::onebot_close,
            commands::win::win_close,
            commands::win::win_minimize,
            commands::win::win_maximize,
            commands::win::win_always_top,
            commands::win::win_get_window_info,
            commands::win::win_move,
            // commands::win::win_open_dev_tools,
            // commands::win::win_relaunch,
            commands::opt::opt_get_system_info,
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
