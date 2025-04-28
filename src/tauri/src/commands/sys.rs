use std::{collections::HashMap, ffi::CStr, process::Command};
use crate::PROXY_PORT;

use log::{debug, error, info};
use serde_json::Value;
use tauri::{command, menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder}, AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;

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
    #[cfg(target_os = "windows")] {
        use winver::WindowsVersion;
        let version = WindowsVersion::detect().unwrap();
        return format!("{}.{}.{}", version.major, version.minor, version.build)
    }
    #[cfg(not(target_os = "windows"))] {
        return "".to_string();
    }
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
pub fn sys_send_notice(app: AppHandle, data: HashMap<String, Value>) {
    app.notification().builder()
        .title(data.get("title").unwrap().as_str().unwrap())
        .body(data.get("body").unwrap().as_str().unwrap())
        .icon("../../build/icon-client-others.png")
        .show()
        .unwrap();
}

// #[command]
// pub fn sys_close_notice() -> String {
//     return "".to_string();
// }

// #[command]
// pub fn sys_clear_notice() -> String {
//     return "".to_string();
// }

// #[command]
// pub fn sys_close_all_notice() -> String {
//     return "".to_string();
// }

#[command]
pub fn sys_run_command(data: String) -> HashMap<String, Value> {
    let mut ret: HashMap<String, Value> = HashMap::new();

    match Command::new(data).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            ret.insert("success".to_string(), true.into());
            ret.insert("message".to_string(), stdout.into());
        },
        Err(e) => {
            ret.insert("success".to_string(), false.into());
            ret.insert("message".to_string(), e.to_string().into());
        }
    }

    return ret;
}

#[command]
pub fn sys_get_gnome_ext() -> String {
    return "".to_string();
}

#[command]
pub fn sys_open_in_browser(app_handle: tauri::AppHandle, data: String) {
    let _ = app_handle.opener().open_path(data, None::<&str>);
}

#[command]
pub fn sys_create_menu(app: tauri::AppHandle, data: HashMap<String, String>) -> Result<(), String> {
    #[cfg(target_os = "macos")] {
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
    }
    Ok(())
}

#[command]
pub fn sys_update_menu(app: tauri::AppHandle, parent: String, id: String, action: String, value: String) -> Result<(), String> {
    #[cfg(target_os = "macos")] {
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
    }
    Ok(())
}

#[command]
pub fn sys_run_proxy() -> u16 {
    return PROXY_PORT.get().unwrap().clone();
}

#[command]
pub fn sys_get_win_color() -> Option<String> {
    #[cfg(target_os = "macos")] {
        use cocoa::{base::nil, foundation::NSAutoreleasePool};
        use objc2::{msg_send, runtime::{AnyClass, AnyObject}};
        unsafe {
            let _pool = NSAutoreleasePool::new(nil);
            let ns_color_class = AnyClass::get(CStr::from_bytes_with_nul_unchecked(b"NSColor\0"))?;
            let ns_color_space_class = AnyClass::get(CStr::from_bytes_with_nul_unchecked(b"NSColorSpace\0"))?;

            // 获取控制强调色
            let accent_color: *mut AnyObject = msg_send![ns_color_class, controlAccentColor];
            if accent_color.is_null() {
                error!("获取强调色失败 ……");
                return Some("00000000".to_string());
            } else {
                debug!("accent color: {:?}", accent_color);
            }

            // 将颜色转换为 RGB 空间
            let device_rgb: *mut AnyObject = msg_send![ns_color_space_class, deviceRGBColorSpace];
            let rgb_color: *mut AnyObject = msg_send![accent_color, colorUsingColorSpace: device_rgb];
            if rgb_color.is_null() {
                error!("转换强调色色彩空间失败 ……");
                return Some("00000000".to_string());
            } else {
                debug!("rgb color: {:?}", rgb_color);
            }

            let r: f64 = msg_send![rgb_color, redComponent];
            let g: f64 = msg_send![rgb_color, greenComponent];
            let b: f64 = msg_send![rgb_color, blueComponent];
            let r_hex = (r * 255.0).round() as u8;
            let g_hex = (g * 255.0).round() as u8;
            let b_hex = (b * 255.0).round() as u8;

            let color = format!("{:02X}{:02X}{:02X}{:02X}", r_hex, g_hex, b_hex, 0xFF);
            info!("获取强调色成功: {}", color);
            return Some(color)
        }
    }
    #[cfg(target_os = "windows")] {
        use windows::Win32::Graphics::Dwm::DwmGetColorizationColor;
        use windows_result::BOOL;
        unsafe {
            let mut color: u32 = 0;
            let mut opaque: BOOL = windows_result::BOOL(0);
            if DwmGetColorizationColor(&mut color, &mut opaque).is_ok() {
                let r = ((color >> 16) & 0xff) as u8;
                let g = ((color >> 8) & 0xff) as u8;
                let b = (color & 0xff) as u8;

                let color = format!("{:02X}{:02X}{:02X}{:02X}", r, g, b, 0xFF);
                info!("获取强调色成功: {}", color);
                return Some(color)
            } else {
                info!("获取强调色失败 ……");
                return Some("00000000".to_string())
            }
        }
    }
    return Some("00000000".to_string());
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
