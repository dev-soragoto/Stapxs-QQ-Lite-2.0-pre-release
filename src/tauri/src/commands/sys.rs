use tauri::command;

#[command]
pub fn sys_get_platform() -> String {
    // win32、darwin、linux，其他情况全算做 linux
    if cfg!(windows) {
        return "win32".to_string();
    } else if cfg!(target_os = "macos") {
        return "darwin".to_string();
    } else {
        return "linux".to_string();
    }
}

#[command]
pub fn sys_get_release() -> String {
    return "".to_string();
}

#[command]
pub fn sys_find_service() -> String {
    return "".to_string();
}

#[command]
pub fn sys_preview_link() -> String {
    return "".to_string();
}

#[command]
pub fn sys_download() -> String {
    return "".to_string();
}

#[command]
pub fn sys_send_notice() -> String {
    return "".to_string();
}

#[command]
pub fn sys_close_notice() -> String {
    return "".to_string();
}

#[command]
pub fn sys_clear_notice() -> String {
    return "".to_string();
}

#[command]
pub fn sys_close_all_notice() -> String {
    return "".to_string();
}

#[command]
pub fn sys_run_command() -> String {
    return "".to_string();
}

#[command]
pub fn sys_get_gnome_ext() -> String {
    return "".to_string();
}

#[command]
pub fn sys_create_menu() -> String {
    return "".to_string();
}

#[command]
pub fn sys_update_menu() -> String {
    return "".to_string();
}

// macOS：Touch Bar 支持
// #[command]
// pub fn sys_flush_on_message() -> String {
//     return "".to_string();
// }

// #[command]
// pub fn sys_flush_friend_search() -> String {
//     return "".to_string();
// }
