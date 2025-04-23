use std::collections::HashMap;
use tauri::command;

#[command]
pub fn opt_get_system_info() -> HashMap<String, [String; 2]> {
    let tauri_version = tauri::VERSION.to_string();
    let mut data = HashMap::new();
    data.insert(String::from("tauri"), [String::from("Tauri Version   "), tauri_version]);
    return data;
}
