#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_title("BypassNote")?;
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { 
                width: 1200.0, 
                height: 800.0 
            }))?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}