/**
 * 平台密码管理器集成
 *
 * 负u8d23数据库加密密钥的持久化：
 * - 首次运行：生成随机 32 字节 hex 密钥，写入系统密码管理器
 * - 后续运行：从密码管理器读取，不再重复生成
 *
 * macOS  → Security Framework 钒匙串 (SecGenericPassword)
 * Windows → Windows 凭据管理器 (CredRead / CredWrite)
 * 其他平台 → 回退到 DB_KEY_FALLBACK 常量
 */

#[cfg(target_os = "macos")]
pub use macos::get_or_create_db_key;

#[cfg(target_os = "windows")]
pub use windows_cred::get_or_create_db_key;

#[cfg(target_os = "linux")]
pub use linux_secret::get_or_create_db_key;

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
/// 其他平台占位：永远不会被调用，db.rs 会在编译期跳过
#[allow(dead_code)]
pub fn get_or_create_db_key() -> Result<String, String> {
    unreachable!("平台不支持安全存储密钥方案")
}

// ── Windows 凭据管理器实现 ────────────────────────────────────

#[cfg(target_os = "windows")]
mod windows_cred {
    use windows::Win32::Security::Credentials::{
        CredFree, CredReadW, CredWriteW, CREDENTIALW,
        CRED_PERSIST_LOCAL_MACHINE, CRED_TYPE_GENERIC,
    };
    use windows::core::PWSTR;

    /// 凭据目标名称（在凭据管理器 UI 中可见）
    const TARGET: &str = "cn.stapxs.qqweb/db_encryption_key";
    /// 凭据关联的用户名
    const USERNAME: &str = "stapxs-qq-lite";

    /// HRESULT(ERROR_NOT_FOUND)：凭据条目不存在
    const ERROR_NOT_FOUND_HR: i32 = 0x80070490u32 as i32;

    /// 从 Windows 凭据管理器读取数据库密钥；若不存在则生成并写入后返回。
    pub fn get_or_create_db_key() -> Result<String, String> {
        match read_credential() {
            Ok(key) => {
                log::info!("从 Windows 凭据管理器读取数据库密钥成功");
                return Ok(key);
            }
            Err(e) => {
                // 仅忽略"条目不存在"错误，其他错误上报
                if !e.starts_with("NOT_FOUND:") {
                    return Err(format!("凭据管理器读取失败：{}", e));
                }
            }
        }

        let key = generate_key();
        log::info!("首次运行，生成新的数据库密钥并写入 Windows 凭据管理器");
        write_credential(&key)?;
        Ok(key)
    }

    fn read_credential() -> Result<String, String> {
        let target_wide: Vec<u16> = TARGET.encode_utf16().chain(std::iter::once(0)).collect();
        let mut pcred: *mut CREDENTIALW = std::ptr::null_mut();

        unsafe {
            CredReadW(
                windows::core::PCWSTR(target_wide.as_ptr()),
                CRED_TYPE_GENERIC,
                Some(0),
                &mut pcred,
            )
            .map_err(|e| {
                if e.code().0 == ERROR_NOT_FOUND_HR {
                    // 用特殊前缀标记"未找到"，与其他错误区分
                    format!("NOT_FOUND:{}", e)
                } else {
                    format!("CredReadW 失败（HRESULT {:#010x}）：{}", e.code().0, e)
                }
            })?;

            if pcred.is_null() {
                return Err("NOT_FOUND:凭据指针为空".to_string());
            }

            let cred = &*pcred;
            let blob_size = cred.CredentialBlobSize as usize;
            let blob = std::slice::from_raw_parts(cred.CredentialBlob, blob_size);
            let key = String::from_utf8(blob.to_vec())
                .map_err(|e| format!("密钥编码无效：{}", e))?;

            CredFree(pcred as *const _);
            Ok(key)
        }
    }

    fn write_credential(key: &str) -> Result<(), String> {
        let target_wide: Vec<u16> = TARGET.encode_utf16().chain(std::iter::once(0)).collect();
        let username_wide: Vec<u16> = USERNAME.encode_utf16().chain(std::iter::once(0)).collect();
        let blob = key.as_bytes();

        let cred = CREDENTIALW {
            Flags: windows::Win32::Security::Credentials::CRED_FLAGS(0),
            Type: CRED_TYPE_GENERIC,
            TargetName: PWSTR(target_wide.as_ptr() as *mut u16),
            Comment: PWSTR::null(),
            LastWritten: windows::Win32::Foundation::FILETIME::default(),
            CredentialBlobSize: blob.len() as u32,
            CredentialBlob: blob.as_ptr() as *mut u8,
            Persist: CRED_PERSIST_LOCAL_MACHINE,
            AttributeCount: 0,
            Attributes: std::ptr::null_mut(),
            TargetAlias: PWSTR::null(),
            UserName: PWSTR(username_wide.as_ptr() as *mut u16),
        };

        unsafe {
            CredWriteW(&cred, 0)
                .map_err(|e| format!("CredWriteW 失败（HRESULT {:#010x}）：{}", e.code().0, e))?;
        }
        Ok(())
    }

    fn generate_key() -> String {
        use rand::RngCore;
        let mut buf = [0u8; 32];
        rand::rng().fill_bytes(&mut buf);
        buf.iter().map(|b| format!("{:02x}", b)).collect()
    }
}

// ── macOS 实现 ────────────────────────────────────────────────

#[cfg(target_os = "macos")]
mod macos {
    use security_framework::passwords::{get_generic_password, set_generic_password};

    /// 应用标识符，与 tauri.conf.json identifier 保持一致
    const SERVICE: &str = "cn.stapxs.qqweb";
    /// 钥匙串条目的账户名称
    const ACCOUNT: &str = "db_encryption_key";

    /// 从钥匙串读取数据库密钥；若不存在则生成并写入后返回。
    ///
    /// 错误时返回 Err(String) 供调用方决定是否回退。
    pub fn get_or_create_db_key() -> Result<String, String> {
        // ── 尝试读取 ──────────────────────────────────────────
        match get_generic_password(SERVICE, ACCOUNT) {
            Ok(bytes) => {
                let key = String::from_utf8(bytes)
                    .map_err(|e| format!("钥匙串密钥编码无效：{}", e))?;
                log::info!("从钥匙串读取数据库密钥成功");
                return Ok(key);
            }
            Err(e) => {
                // errSecItemNotFound = -25300：条目不存在，需要新建
                // 其他错误直接上报
                if e.code() != -25300 {
                    return Err(format!("钥匙串读取失败（code {}）：{}", e.code(), e));
                }
            }
        }

        // ── 首次运行：生成随机密钥 ──────────────────────────
        let key = generate_key();
        log::info!("首次运行，生成新的数据库密钥并写入钥匙串");

        set_generic_password(SERVICE, ACCOUNT, key.as_bytes())
            .map_err(|e| format!("写入钥匙串失败（code {}）：{}", e.code(), e))?;

        Ok(key)
    }

    /// 生成加密安全的 32 字节随机密钥（hex 编码，64 个字符）
    fn generate_key() -> String {
        use rand::RngCore;
        let mut buf = [0u8; 32];
        rand::rng().fill_bytes(&mut buf);
        buf.iter().map(|b| format!("{:02x}", b)).collect()
    }
}

// ── Linux Secret Service 实现 ─────────────────────────────────
//
// 使用 freedesktop Secret Service API（GNOME Keyring / KWallet 等均实现了此协议）。
// secret-service v3 是纯 async 的；open_db 是同步调用点，所以需要在调用处
// 手动处理 runtime：若已在 tokio context 中则用 block_in_place，否则新建 runtime。

#[cfg(target_os = "linux")]
mod linux_secret {
    use secret_service::{EncryptionType, SecretService};
    use std::collections::HashMap;

    /// 条目显示标签
    const LABEL: &str = "Stapxs QQ Lite 数据库密钥";
    /// 搜索属性：应用标识
    const ATTR_APP: &str = "application";
    const ATTR_APP_VAL: &str = "cn.stapxs.qqweb";
    /// 搜索属性：密钥类型
    const ATTR_KEY: &str = "key_type";
    const ATTR_KEY_VAL: &str = "db_encryption_key";

    pub fn get_or_create_db_key() -> Result<String, String> {
        // setup 回调在主线程调用，通常不在 tokio context 内；
        // 但为了健壮性两种情况都处理。
        match tokio::runtime::Handle::try_current() {
            Ok(handle) => {
                // 已在 tokio context 内，用 block_in_place 避免嵌套 block_on
                tokio::task::block_in_place(|| handle.block_on(inner()))
            }
            Err(_) => {
                // 不在 tokio context，建临时单线程 runtime
                let rt = tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build()
                    .map_err(|e| format!("创建临时 runtime 失败：{}", e))?;
                rt.block_on(inner())
            }
        }
    }

    async fn inner() -> Result<String, String> {
        let ss = SecretService::connect(EncryptionType::Dh)
            .await
            .map_err(|e| format!("连接 Secret Service 失败：{}", e))?;

        let collection = ss
            .get_default_collection()
            .await
            .map_err(|e| format!("获取默认密钥集合失败：{}", e))?;

        // 若集合被锁，尝试解锁（会弹出系统授权对话框）
        if collection
            .is_locked()
            .await
            .map_err(|e| format!("检查锁定状态失败：{}", e))?
        {
            collection
                .unlock()
                .await
                .map_err(|e| format!("解锁密钥集合失败：{}", e))?;
        }

        let attrs: HashMap<&str, &str> = [
            (ATTR_APP, ATTR_APP_VAL),
            (ATTR_KEY, ATTR_KEY_VAL),
        ]
        .iter()
        .cloned()
        .collect();

        // ── 尝试读取已存在的密钥 ─────────────────────────────
        let items = collection
            .search_items(attrs.clone())
            .await
            .map_err(|e| format!("搜索密钥条目失败：{}", e))?;

        if let Some(item) = items.first() {
            let secret = item
                .get_secret()
                .await
                .map_err(|e| format!("读取密钥内容失败：{}", e))?;
            let key = String::from_utf8(secret)
                .map_err(|e| format!("密钥编码无效：{}", e))?;
            log::info!("从 Secret Service 读取数据库密钥成功");
            return Ok(key);
        }

        // ── 首次运行：生成随机密钥并写入 ─────────────────────
        let key = generate_key();
        log::info!("首次运行，生成新的数据库密钥并写入 Secret Service");

        collection
            .create_item(
                LABEL,
                attrs,
                key.as_bytes(),
                true,         // replace = true：若同名条目意外存在则覆盖
                "text/plain",
            )
            .await
            .map_err(|e| format!("写入 Secret Service 失败：{}", e))?;

        Ok(key)
    }

    fn generate_key() -> String {
        use rand::RngCore;
        let mut buf = [0u8; 32];
        rand::rng().fill_bytes(&mut buf);
        buf.iter().map(|b| format!("{:02x}", b)).collect()
    }
}
