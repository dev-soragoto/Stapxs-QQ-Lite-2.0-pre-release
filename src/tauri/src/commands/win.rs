use std::collections::HashMap;
use tauri::{command, LogicalPosition};

#[command]
pub fn win_close(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
pub fn win_minimize(window: tauri::Window) {
    window.minimize().unwrap();
}

#[tauri::command]
pub fn win_maximize(window: tauri::Window) {
    window.maximize().unwrap();
}

// #[command]
// pub fn win_relaunch() {
//     // 重新启动窗口
//     let app = tauri::AppHandle::current();
//     app.relaunch().unwrap();
//     app.exit(0);
// }

#[command]
pub fn win_always_top(window: tauri::Window, data: bool) {
    window.set_always_on_top(data).unwrap();
}


#[command]
pub fn win_get_window_info(window: tauri::Window) -> HashMap<String, i32> {
    // 获取 x, y, width, height
    let position = window.outer_position().unwrap();
    let size = window.outer_size().unwrap();
    let mut data = HashMap::new();
    data.insert(String::from("x"), position.x);
    data.insert(String::from("y"), position.y);
    data.insert(String::from("width"), size.width as i32);
    data.insert(String::from("height"), size.height as i32);
    return data;
}

#[command]
pub fn win_move(window: tauri::Window, x: i32, y: i32) {
    window.set_position(LogicalPosition::new(x, y)).unwrap();
}

// #[command]
// pub fn win_open_dev_tools(window: tauri::Window) {
//     // tauri 不提供此功能
// }

#[command]
pub fn win_get_win_color() -> String {
    return "".to_string();
}
