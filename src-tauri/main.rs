#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // For production builds, use the distDir from tauri.conf.json
            #[cfg(not(debug_assertions))]
            {
                let window = app.get_window("main").unwrap();
                window.set_title("BypassNote").unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}