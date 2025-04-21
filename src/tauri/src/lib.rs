use tauri::{ WebviewWindowBuilder, WebviewUrl, TitleBarStyle };
use tauri::window::{ Effect, EffectsBuilder, Color };
use window_vibrancy::*;

#[tauri::command]
fn get_platform() -> String {
    return std::env::consts::OS.to_string();
}

#[tauri::command]
fn get_release() -> String {
    // if cfg!(windows) {
    //     unsafe {
    //         let mut os_info: OSVERSIONINFOW = zeroed();
    //         os_info.dwOSVersionInfoSize = std::mem::size_of::<OSVERSIONINFOW>() as u32;

    //         if RtlGetVersion(&mut os_info) == 0 {
    //             return os_info.dwBuildNumber.to_string();
    //         }
    //     }
    // }
    return "".to_string();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
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
                window.close_devtools();
            }

            // #[cfg(target_os = "windows")]
            // apply_blur(&window, Some((18, 18, 18, 125)))
            //     .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_platform,
            get_release,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
