use std::collections::HashMap;
use crate::PROXY_PORT;

use log::debug;
use tauri::{command, Emitter, menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder}};

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
pub fn sys_create_menu(app: tauri::AppHandle, data: HashMap<String, String>) -> Result<(), String> {
    let about = MenuItemBuilder::new(data.get("about").unwrap())
        .id("about").build(&app).map_err(|e| e.to_string())?;
    let check_update = MenuItemBuilder::new(data.get("update").unwrap())
        .id("checkUpdate").build(&app).map_err(|e| e.to_string())?;

    let app_submenu = SubmenuBuilder::new(&app, data.get("title").unwrap())
        .item(&about)
        .item(&check_update)
        .separator()
        .hide_with_text(data.get("hide").unwrap())
        .hide_others_with_text(data.get("hideOthers").unwrap())
        .show_all_with_text(data.get("unhide").unwrap())
        .separator()
        .quit_with_text(data.get("quit").unwrap())
        .id("app")
        .build().map_err(|e| e.to_string())?;

    let edit_submenu = SubmenuBuilder::new(&app, data.get("edit").unwrap())
        .undo_with_text(data.get("undo").unwrap())
        .redo_with_text(data.get("redo").unwrap())
        .separator()
        .cut_with_text(data.get("cut").unwrap())
        .copy_with_text(data.get("copy").unwrap())
        .paste_with_text(data.get("paste").unwrap())
        .separator()
        .select_all_with_text(data.get("selectAll").unwrap())
        .id("edit")
        .build().map_err(|e| e.to_string())?;

        let user_name = MenuItemBuilder::new(data.get("login").unwrap())
            .id("userName").build(&app).map_err(|e| e.to_string())?;
        let logout = MenuItemBuilder::new(data.get("logout").unwrap())
            .id("logout").build(&app).map_err(|e| e.to_string())?;
        logout.set_enabled(false).map_err(|e| e.to_string())?;
        let user_list = MenuItemBuilder::new(data.get("userList").unwrap())
            .id("userList").build(&app).map_err(|e| e.to_string())?;
        let flush_user = MenuItemBuilder::new(data.get("flushUser").unwrap())
            .id("flushUser").build(&app).map_err(|e| e.to_string())?;

        let account_submenu = SubmenuBuilder::new(&app, data.get("account").unwrap())
            .item(&user_name)
            .item(&logout)
            .separator()
            .item(&user_list)
            .item(&flush_user)
            .id("account")
            .build().map_err(|e| e.to_string())?;

        let doc = MenuItemBuilder::new(data.get("doc").unwrap())
            .id("doc").build(&app).map_err(|e| e.to_string())?;
        let feedback = MenuItemBuilder::new(data.get("feedback").unwrap())
            .id("feedback").build(&app).map_err(|e| e.to_string())?;
        let license = MenuItemBuilder::new(data.get("license").unwrap())
            .id("license").build(&app).map_err(|e| e.to_string())?;

        let help_submenu = SubmenuBuilder::new(&app, data.get("help").unwrap())
            .item(&doc)
            .item(&feedback)
            .separator()
            .item(&license)
            .id("help")
            .build().map_err(|e| e.to_string())?;

    let menu = MenuBuilder::new(&app)
        .items(&[
            &app_submenu,
            &edit_submenu,
            &account_submenu,
            &help_submenu,
        ])
        .build().map_err(|e| e.to_string())?;

    app.set_menu(menu).map_err(|e| e.to_string())?;
    app.on_menu_event(|app, menu| {
        match menu.id().0.as_str() {
            "about" => {
                app.emit("app:about", "").unwrap();
            }
            "logout" => {
                app.emit("bot:logout", "").unwrap();
            }
            "userList" => {
                app.emit("app:changeTab", "Friend").unwrap();
            }
            "flushUser" => {
                app.emit("bot:flushUser", "").unwrap();
            }
            "doc" => {
                app.emit("app:openLink", "https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/wiki").unwrap();
            }
            "feedback" => {
                app.emit("app:openLink", "https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/issues").unwrap();
            }
            "license" => {
                app.emit("app:openLink", "https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/blob/master/LICENSE").unwrap();
            }
            _ => {}
        }
    });
    Ok(())
}

#[command]
pub fn sys_update_menu(app: tauri::AppHandle, parent: String, id: String, action: String, value: String) -> Result<(), String> {
    debug!("菜单更新: id={}.{}, action={}, value={}", parent, id, action, value);
    // let menu = app.get_webview_window("main").unwrap().menu().unwrap();
    let menu = app.menu().unwrap();
    let submenu = menu.get(&parent);
    if submenu.is_some() {
        let item =
            submenu.unwrap().as_submenu().unwrap().get(&id);
        if item.is_some() {
            let item = item.unwrap();
            match action.as_str() {
                "label" => {
                    item.as_menuitem().unwrap().set_text(value.as_str()).map_err(|e| e.to_string())?;
                }
                "visible" => {
                    if value == "true" {
                        item.as_menuitem().unwrap().set_enabled(true).map_err(|e| e.to_string())?;
                    } else {
                        item.as_menuitem().unwrap().set_enabled(false).map_err(|e| e.to_string())?;
                    }
                }
                _ => {}
            }
        } else {
            debug!("菜单项不存在: {}", id);
        }
    } else {
        debug!("菜单不存在: {}", parent);
    }
    Ok(())
}

#[command]
pub fn sys_run_proxy() -> u16 {
    return PROXY_PORT.get().unwrap().clone();
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
