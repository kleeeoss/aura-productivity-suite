mod vault;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(vault::VaultWatcherState::new())
    .setup(|app| {
      if cfg!(debug_assertions) {
        let _ = app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        );
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      vault::vault_scan,
      vault::vault_read,
      vault::vault_write_atomic,
      vault::vault_delete,
      vault::vault_create_folder,
      vault::vault_delete_folder,
      vault::vault_rename,
      vault::vault_search,
      vault::vault_watch_start,
      vault::vault_watch_stop,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
