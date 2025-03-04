use tauri::Manager;

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
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
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
