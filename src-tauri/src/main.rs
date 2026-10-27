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
                    // L'interface web exporte les fichiers via une URL blob. Diriger le
                    // téléchargement vers le dossier Téléchargements de l'utilisateur quand
                    // la webview ne fournit pas de destination.
                    if let DownloadEvent::Requested { destination, .. } = event {
                        if destination.as_os_str().is_empty() {
                            if let Ok(download_dir) = webview.app_handle().path().download_dir() {
                                *destination = download_dir.join("export.bpnote");
                            }
                        }
                        // S'assurer que le dossier cible existe (par exemple sur un
                        // profil Windows neuf où le dossier Téléchargements est absent).
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
