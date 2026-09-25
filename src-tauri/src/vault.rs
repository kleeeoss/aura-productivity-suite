use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, State};
use notify_debouncer_mini::{new_debouncer, notify::RecursiveMode, DebounceEventResult, Debouncer};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultFileInfo {
    pub path: String,
    pub name: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    pub size: u64,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frontmatter: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultSearchResult {
    pub path: String,
    pub matches: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultWatchEvent {
    pub event: String,
    pub path: String,
}

pub struct VaultWatcherState(pub Mutex<Option<Debouncer<notify::RecommendedWatcher>>>);

impl VaultWatcherState {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

fn safe_join(vault_root: &str, relative_path: &str) -> Result<PathBuf, String> {
    let root = Path::new(vault_root);
    // Normalize relative path
    let cleaned = relative_path
        .replace('\\', "/")
        .trim_start_matches('/')
        .to_string();

    if cleaned.split('/').any(|p| p == "..")
        || cleaned.contains(':')
        || Path::new(&cleaned).is_absolute()
    {
        return Err("Path traversal detected".to_string());
    }

    Ok(root.join(cleaned))
}

fn iso_timestamp(time: SystemTime) -> String {
    let duration = time.duration_since(UNIX_EPOCH).unwrap_or(Duration::ZERO);
    let secs = duration.as_secs();
    // Format basic ISO 8601 UTC
    let days = secs / 86400;
    let rem_secs = secs % 86400;
    let hours = rem_secs / 3600;
    let minutes = (rem_secs % 3600) / 60;
    let seconds = rem_secs % 60;

    // Days since 1970-01-01 to Year-Month-Day
    let mut year = 1970i64;
    let mut day_count = days as i64;
    loop {
        let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        let days_in_year = if leap { 366 } else { 365 };
        if day_count < days_in_year {
            break;
        }
        day_count -= days_in_year;
        year += 1;
    }
    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let days_in_months = [
        31, if leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];
    let mut month = 1;
    for &dim in days_in_months.iter() {
        if day_count < dim {
            break;
        }
        day_count -= dim;
        month += 1;
    }
    let day = day_count + 1;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, minutes, seconds
    )
}

fn parse_simple_frontmatter(content: &str) -> Option<serde_json::Value> {
    let content = content.strip_prefix('\u{feff}').unwrap_or(content);
    if !content.starts_with("---") {
        return None;
    }
    let after_start = &content[3..];
    let end_idx = after_start.find("\n---")?;
    let yaml_slice = &after_start[..end_idx];

    let mut map = serde_json::Map::new();
    let mut current_key: Option<String> = None;
    let mut current_list: Option<Vec<serde_json::Value>> = None;

    for line in yaml_slice.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        if trimmed.starts_with("- ") {
            if let Some(ref mut list) = current_list {
                let item = trimmed[2..].trim().trim_matches('"').trim_matches('\'');
                list.push(serde_json::Value::String(item.to_string()));
            }
            continue;
        }

        if let Some(ref key) = current_key {
            if let Some(list) = current_list.take() {
                map.insert(key.clone(), serde_json::Value::Array(list));
            }
        }

        if let Some((k, v)) = line.split_once(':') {
            let key = k.trim().to_string();
            let val = v.trim();
            if val.is_empty() {
                current_key = Some(key);
                current_list = Some(Vec::new());
            } else if val.starts_with('[') && val.ends_with(']') {
                current_key = None;
                current_list = None;
                let inner = val[1..val.len() - 1].trim();
                let items: Vec<serde_json::Value> = if inner.is_empty() {
                    Vec::new()
                } else {
                    inner
                        .split(',')
                        .map(|s| {
                            let clean = s.trim().trim_matches('"').trim_matches('\'');
                            serde_json::Value::String(clean.to_string())
                        })
                        .collect()
                };
                map.insert(key, serde_json::Value::Array(items));
            } else {
                current_key = None;
                current_list = None;
                let clean_val = val.trim_matches('"').trim_matches('\'');
                if clean_val == "true" {
                    map.insert(key, serde_json::Value::Bool(true));
                } else if clean_val == "false" {
                    map.insert(key, serde_json::Value::Bool(false));
                } else if let Ok(num) = clean_val.parse::<i64>() {
                    map.insert(key, serde_json::Value::Number(num.into()));
                } else {
                    map.insert(key, serde_json::Value::String(clean_val.to_string()));
                }
            }
        }
    }

    if let Some(ref key) = current_key {
        if let Some(list) = current_list.take() {
            map.insert(key.clone(), serde_json::Value::Array(list));
        }
    }

    Some(serde_json::Value::Object(map))
}

fn scan_dir_recursive(
    root: &Path,
    current: &Path,
    results: &mut Vec<VaultFileInfo>,
) -> Result<(), String> {
    let entries = fs::read_dir(current).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden/system files, .trash, .git, node_modules, and .aura-tmp
        if file_name.starts_with('.') || file_name == "node_modules" || file_name.ends_with(".aura-tmp") {
            continue;
        }

        let rel_path = path
            .strip_prefix(root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");

        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let is_dir = metadata.is_dir();
        let size = metadata.len();
        let mtime = metadata.modified().unwrap_or(SystemTime::now());
        let updated_at = iso_timestamp(mtime);

        let mut frontmatter = None;
        if !is_dir && file_name.ends_with(".md") && size < 5_000_000 {
            // Read first 2KB for frontmatter
            if let Ok(mut f) = File::open(&path) {
                let mut buf = [0u8; 2048];
                if let Ok(n) = f.read(&mut buf) {
                    if let Ok(text) = std::str::from_utf8(&buf[..n]) {
                        frontmatter = parse_simple_frontmatter(text);
                    }
                }
            }
        }

        results.push(VaultFileInfo {
            path: rel_path,
            name: file_name,
            is_directory: is_dir,
            size,
            updated_at,
            frontmatter,
        });

        if is_dir {
            let _ = scan_dir_recursive(root, &path, results);
        }
    }

    Ok(())
}

#[tauri::command]
pub fn vault_scan(vault_root: String) -> Result<Vec<VaultFileInfo>, String> {
    let root = Path::new(&vault_root);
    if !root.exists() {
        fs::create_dir_all(root).map_err(|e| e.to_string())?;
    }

    let mut results = Vec::new();
    scan_dir_recursive(root, root, &mut results)?;
    Ok(results)
}

#[tauri::command]
pub fn vault_read(vault_root: String, relative_path: String) -> Result<String, String> {
    let full_path = safe_join(&vault_root, &relative_path)?;
    fs::read_to_string(&full_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn vault_write_atomic(
    vault_root: String,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    let full_path = safe_join(&vault_root, &relative_path)?;

    if let Some(parent) = full_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let file_name = full_path
        .file_name()
        .ok_or("Invalid filename")?
        .to_string_lossy();
    let tmp_path = full_path.with_file_name(format!(".{}.aura-tmp", file_name));

    {
        let mut file = File::create(&tmp_path).map_err(|e| e.to_string())?;
        file.write_all(content.as_bytes())
            .map_err(|e| e.to_string())?;
        file.flush().map_err(|e| e.to_string())?;
        file.sync_all().map_err(|e| e.to_string())?;
    }

    fs::rename(&tmp_path, &full_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn vault_delete(vault_root: String, relative_path: String) -> Result<(), String> {
    let src_path = safe_join(&vault_root, &relative_path)?;
    if !src_path.exists() {
        return Err("File not found".to_string());
    }

    let trash_dir = Path::new(&vault_root).join(".trash");
    let dest_path = trash_dir.join(&relative_path);

    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    // If destination already exists, move with timestamp
    let final_dest = if dest_path.exists() {
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_millis();
        let stem = dest_path.file_stem().unwrap_or_default().to_string_lossy();
        let ext = dest_path.extension().map(|e| format!(".{}", e.to_string_lossy())).unwrap_or_default();
        dest_path.with_file_name(format!("{}_{}{}", stem, ts, ext))
    } else {
        dest_path
    };

    fs::rename(&src_path, &final_dest).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn vault_create_folder(vault_root: String, relative_path: String) -> Result<(), String> {
    let full_path = safe_join(&vault_root, &relative_path)?;
    fs::create_dir_all(&full_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn vault_delete_folder(vault_root: String, relative_path: String) -> Result<(), String> {
    let src_path = safe_join(&vault_root, &relative_path)?;
    if !src_path.exists() {
        return Err("Folder not found".to_string());
    }

    let trash_dir = Path::new(&vault_root).join(".trash");
    let dest_path = trash_dir.join(&relative_path);
    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let final_dest = if dest_path.exists() {
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_millis();
        let stem = dest_path.file_name().unwrap_or_default().to_string_lossy();
        dest_path.with_file_name(format!("{}_{}", stem, ts))
    } else {
        dest_path
    };

    fs::rename(&src_path, &final_dest).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn vault_rename(
    vault_root: String,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let src_path = safe_join(&vault_root, &old_path)?;
    let dest_path = safe_join(&vault_root, &new_path)?;

    if !src_path.exists() {
        return Err("Source file not found".to_string());
    }

    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    fs::rename(&src_path, &dest_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn vault_search(vault_root: String, query: String) -> Result<Vec<VaultSearchResult>, String> {
    let root = Path::new(&vault_root);
    if !root.exists() {
        return Ok(Vec::new());
    }

    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    fn search_recursive(
        root: &Path,
        current: &Path,
        query: &str,
        results: &mut Vec<VaultSearchResult>,
    ) {
        if let Ok(entries) = fs::read_dir(current) {
            for entry in entries.flatten() {
                let path = entry.path();
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with('.') || name == "node_modules" {
                    continue;
                }

                if path.is_dir() {
                    search_recursive(root, &path, query, results);
                } else if name.ends_with(".md") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        let mut matches = Vec::new();
                        for line in content.lines() {
                            if line.to_lowercase().contains(query) {
                                matches.push(line.trim().to_string());
                                if matches.len() >= 10 {
                                    break;
                                }
                            }
                        }
                        if !matches.is_empty() {
                            let rel = path
                                .strip_prefix(root)
                                .map(|p| p.to_string_lossy().replace('\\', "/"))
                                .unwrap_or_else(|_| name.clone());
                            results.push(VaultSearchResult {
                                path: rel,
                                matches,
                            });
                        }
                    }
                }
            }
        }
    }

    search_recursive(root, root, &query_lower, &mut results);
    Ok(results)
}

#[tauri::command]
pub fn vault_watch_start(
    app: AppHandle,
    state: State<VaultWatcherState>,
    vault_root: String,
) -> Result<(), String> {
    let mut lock = state.0.lock().map_err(|e| e.to_string())?;
    // Stop existing watcher
    *lock = None;

    let root = PathBuf::from(&vault_root);
    if !root.exists() {
        let _ = fs::create_dir_all(&root);
    }

    let root_clone = root.clone();
    let app_clone = app.clone();

    let mut debouncer = new_debouncer(
        Duration::from_millis(250),
        move |res: DebounceEventResult| {
            if let Ok(events) = res {
                for event in events {
                    let rel_path = event
                        .path
                        .strip_prefix(&root_clone)
                        .map(|p| p.to_string_lossy().replace('\\', "/"))
                        .unwrap_or_default();

                    if rel_path.is_empty() || rel_path.starts_with(".trash") || rel_path.ends_with(".aura-tmp") {
                        continue;
                    }

                    let payload = VaultWatchEvent {
                        event: "modify".to_string(),
                        path: rel_path,
                    };
                    let _ = app_clone.emit("vault:changed", payload);
                }
            }
        },
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(&root, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *lock = Some(debouncer);
    Ok(())
}

#[tauri::command]
pub fn vault_watch_stop(state: State<VaultWatcherState>) -> Result<(), String> {
    let mut lock = state.0.lock().map_err(|e| e.to_string())?;
    *lock = None;
    Ok(())
}
