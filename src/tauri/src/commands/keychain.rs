/**
 * macOS 钥匙串集成
 *
 * 负责数据库加密密钥的持久化：
 * - 首次运行：生成随机 32 字节 hex 密钥，写入系统钥匙串
 * - 后续运行：从钥匙串读取，不再重复生成
 *
 * 其他平台：此模块为空，db.rs 回退到 DB_KEY_FALLBACK 常量。
 */

#[cfg(target_os = "macos")]
pub use macos::get_or_create_db_key;

#[cfg(not(target_os = "macos"))]
/// 非 macOS 占位：永远不会被调用，db.rs 会在编译期跳过
#[allow(dead_code)]
pub fn get_or_create_db_key() -> Result<String, String> {
    unreachable!("keychain is only available on macOS")
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
