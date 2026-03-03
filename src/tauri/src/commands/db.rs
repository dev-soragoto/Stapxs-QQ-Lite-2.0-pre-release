use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use log::{debug, error, info};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

// ── 全局状态 ────────────────────────────────────────────────

/// Tauri managed state：用 Mutex 包装 SQLite 连接
pub struct DbState(pub Mutex<Connection>);

// ── 数据结构 ────────────────────────────────────────────────

/// 单条消息记录（前后端共用）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MsgRecord {
    /// Bot 侧的消息 ID
    pub message_id: String,
    /// 关联会话 ID（group_id 或 user_id）
    pub chat_id: i64,
    /// 会话类型："group" | "private"
    pub chat_type: String,
    /// 发送者 user_id
    pub sender_id: i64,
    /// 发送者昵称（card 优先，fallback nickname）
    pub sender_name: Option<String>,
    /// 消息时间戳（秒，Bot 原始值）
    pub time: i64,
    /// JSON 序列化的 MsgItemElem[] 消息段数组
    pub message: String,
    /// 纯文本摘要（getMsgRawTxt 结果）
    pub raw_message: Option<String>,
    /// 是否已撤回
    pub revoked: bool,
}

/// 加密密钥回退值（仅在非 macOS 平台或钥匙串读取失败时使用）
const DB_KEY_FALLBACK: &str = "12345";

/// 获取当前平台的数据库加密密钥
fn get_db_key() -> String {
    #[cfg(target_os = "macos")]
    {
        match crate::commands::keychain::get_or_create_db_key() {
            Ok(key) => return key,
            Err(e) => log::warn!("钥匙串读取失败，回退到默认密钥：{}", e),
        }
    }
    DB_KEY_FALLBACK.to_string()
}

// ── 初始化 ──────────────────────────────────────────────────

/// 打开（或创建）数据库，建表建索引
pub fn open_db(data_dir: PathBuf) -> rusqlite::Result<Connection> {
    std::fs::create_dir_all(&data_dir).ok();
    let db_path = data_dir.join("messages.db");

    open_or_recreate(db_path)
}

/// 尝试以加密模式打开数据库；若因旧的明文文件导致失败则删除后重建
fn open_or_recreate(db_path: std::path::PathBuf) -> rusqlite::Result<Connection> {
    match try_open_encrypted(&db_path) {
        Ok(conn) => Ok(conn),
        Err(e) => {
            // 旧的明文数据库或文件损坏，删除后重新创建
            log::warn!(
                "无法以加密模式打开 {:?}（{}），将删除旧文件并重建",
                db_path, e
            );
            let _ = std::fs::remove_file(&db_path);
            // 顺带清理 WAL / SHM 临时文件
            let _ = std::fs::remove_file(db_path.with_extension("db-wal"));
            let _ = std::fs::remove_file(db_path.with_extension("db-shm"));
            try_open_encrypted(&db_path)
        }
    }
}

/// 打开并执行加密初始化，返回就绪的连接
fn try_open_encrypted(db_path: &std::path::Path) -> rusqlite::Result<Connection> {
    let conn = Connection::open(db_path)?;

    // 从平台密码管理器获取加密密钥（必须在任何其他操作之前执行）
    let key = get_db_key();
    if key == DB_KEY_FALLBACK {
        log::warn!("使用数据库加密密钥回退值，数据安全性较低");
    }
    conn.execute_batch(&format!("PRAGMA key = '{}';" , key))?;

    // 验证密钥是否正确（query sqlite_master 是 SQLCipher 推荐的验证方式）
    conn.execute_batch("SELECT count(*) FROM sqlite_master;")?;

    // WAL 模式：并发读写性能更好
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            self_id     TEXT    NOT NULL,
            message_id  TEXT    NOT NULL,
            chat_id     INTEGER NOT NULL,
            chat_type   TEXT    NOT NULL,
            sender_id   INTEGER NOT NULL,
            sender_name TEXT,
            time        INTEGER NOT NULL,
            message     TEXT    NOT NULL,
            raw_message TEXT,
            revoked     INTEGER NOT NULL DEFAULT 0,
            created_at  INTEGER NOT NULL,
            UNIQUE(self_id, message_id)
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chat
            ON messages(self_id, chat_id, time, id);
        ",
    )?;

    Ok(conn)
}

// ── 命令实现 ─────────────────────────────────────────────────

/// 批量保存消息（已存在的 message_id 自动忽略，不覆盖）
///
/// 返回实际插入的条数。
#[tauri::command]
pub fn db_save_messages(
    state: State<DbState>,
    self_id: String,
    messages: Vec<MsgRecord>,
) -> Result<usize, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();
    let mut inserted = 0usize;

    debug!("保存 {} 条 {} 的消息 ……", messages.len(), self_id);

    for msg in &messages {
        let n = conn
            .execute(
                "INSERT OR IGNORE INTO messages
                    (self_id, message_id, chat_id, chat_type,
                     sender_id, sender_name, time, message,
                     raw_message, revoked, created_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
                params![
                    self_id,
                    msg.message_id,
                    msg.chat_id,
                    msg.chat_type,
                    msg.sender_id,
                    msg.sender_name,
                    msg.time,
                    msg.message,
                    msg.raw_message,
                    msg.revoked as i32,
                    now,
                ],
            )
            .map_err(|e| e.to_string())?;
        inserted += n;
    }

    Ok(inserted)
}

/// 获取某会话最新 n 条消息（正序返回，revoked 消息不包含）
#[tauri::command]
pub fn db_get_latest(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    n: i64,
) -> Result<Vec<MsgRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                    time, message, raw_message, revoked
             FROM messages
             WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
             ORDER BY time DESC, id DESC
             LIMIT ?3",
        )
        .map_err(|e| e.to_string())?;

    let mut list: Vec<MsgRecord> = stmt
        .query_map(params![self_id, chat_id, n], row_to_record)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    // DESC 查询 → 翻转为正序（旧→新）
    list.reverse();
    Ok(list)
}

/// 获取锚点消息之前（更旧）的 n 条，不含锚点本身，正序返回
///
/// 典型用途：上拉加载更多历史。
#[tauri::command]
pub fn db_get_before(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    message_id: String,
    n: i64,
) -> Result<Vec<MsgRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let anchor = get_anchor(&conn, &self_id, &message_id)
        .ok_or_else(|| format!("message_id '{}' not found in local db", message_id))?;

    let mut stmt = conn
        .prepare(
            "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                    time, message, raw_message, revoked
             FROM messages
             WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
               AND (time < ?3 OR (time = ?3 AND id < ?4))
             ORDER BY time DESC, id DESC
             LIMIT ?5",
        )
        .map_err(|e| e.to_string())?;

    let mut list: Vec<MsgRecord> = stmt
        .query_map(
            params![self_id, chat_id, anchor.0, anchor.1, n],
            row_to_record,
        )
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    list.reverse();
    Ok(list)
}

/// 获取锚点消息之后（更新）的 n 条，不含锚点本身，正序返回
///
/// 典型用途：跳转到指定消息后加载后续内容。
#[tauri::command]
pub fn db_get_after(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    message_id: String,
    n: i64,
) -> Result<Vec<MsgRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let anchor = get_anchor(&conn, &self_id, &message_id)
        .ok_or_else(|| format!("message_id '{}' not found in local db", message_id))?;

    let mut stmt = conn
        .prepare(
            "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                    time, message, raw_message, revoked
             FROM messages
             WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
               AND (time > ?3 OR (time = ?3 AND id > ?4))
             ORDER BY time ASC, id ASC
             LIMIT ?5",
        )
        .map_err(|e| e.to_string())?;

    let list: Vec<MsgRecord> = stmt
        .query_map(
            params![self_id, chat_id, anchor.0, anchor.1, n],
            row_to_record,
        )
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(list)
}

/// 将某条消息标记为已撤回
///
/// 返回是否命中（true = 找到并更新了该消息）。
#[tauri::command]
pub fn db_revoke_message(
    state: State<DbState>,
    self_id: String,
    message_id: String,
) -> Result<bool, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute(
            "UPDATE messages SET revoked = 1
             WHERE self_id = ?1 AND message_id = ?2",
            params![self_id, message_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(n > 0)
}

// ── 内部工具 ─────────────────────────────────────────────────

/// 通过 message_id 查询锚点的 (time, rowid)
fn get_anchor(conn: &Connection, self_id: &str, message_id: &str) -> Option<(i64, i64)> {
    conn.query_row(
        "SELECT time, id FROM messages WHERE self_id = ?1 AND message_id = ?2",
        params![self_id, message_id],
        |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?)),
    )
    .ok()
}

/// 将 rusqlite 行映射为 MsgRecord
fn row_to_record(row: &rusqlite::Row) -> rusqlite::Result<MsgRecord> {
    Ok(MsgRecord {
        message_id: row.get(0)?,
        chat_id: row.get(1)?,
        chat_type: row.get(2)?,
        sender_id: row.get(3)?,
        sender_name: row.get(4)?,
        time: row.get(5)?,
        message: row.get(6)?,
        raw_message: row.get(7)?,
        revoked: row.get::<_, i32>(8)? != 0,
    })
}
