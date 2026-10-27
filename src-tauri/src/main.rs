#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    webview::{DownloadEvent, WebviewWindowBuilder},
    Manager,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let config = app
                .config()
                .app
                .windows
                .first()
                .cloned()
                .expect("the main window must be configured");

            WebviewWindowBuilder::from_config(app.handle(), &config)?
                .on_download(|webview, event| {
                    // The web UI exports files through a blob URL download. Point the
                    // download to the user's Downloads folder when the webview does not
                    // provide a destination itself.
                    if let DownloadEvent::Requested { destination, .. } = event {
                        if destination.as_os_str().is_empty() {
                            if let Ok(download_dir) = webview.app_handle().path().download_dir() {
                                *destination = download_dir.join("export.bpnote");
                            }
                        }
                        // Make sure the target directory exists (for example on a
                        // fresh Windows profile where the Downloads folder is missing).
                        if let Some(parent) = destination.parent() {
                            let _ = std::fs::create_dir_all(parent);
                        }
                    }
                    true
                })
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn app_context_is_valid() {
        let context: tauri::Context<tauri::Wry> = tauri::generate_context!();

        assert_eq!(context.config().product_name.as_deref(), Some("BypassNote"));
        assert_eq!(context.config().identifier, "com.mapersmusic.bypassnote");
    }
}
