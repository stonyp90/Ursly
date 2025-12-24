//! Ursly Agent - GPU Metrics & AI Agent Monitor
//!
//! A lightweight desktop app for monitoring GPU metrics and system resources.

pub mod gpu;
pub mod system;
pub mod commands;

use tauri::Manager;

// ============================================================================
// Developer Tools Toggle
// ============================================================================

#[tauri::command]
fn toggle_devtools(window: tauri::Window) {
    #[cfg(debug_assertions)]
    if let Some(webview_window) = window.get_webview_window("main") {
        let _ = webview_window.eval("console.log('DevTools toggled')");
    }
}

#[tauri::command]
fn open_devtools(_window: tauri::Window) {
    #[cfg(debug_assertions)]
    tracing::info!("DevTools can be opened via right-click -> Inspect Element");
}

#[tauri::command]
fn close_devtools(_window: tauri::Window) {
    #[cfg(debug_assertions)]
    tracing::info!("DevTools closed");
}

// ============================================================================
// Application Entry Point
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                gpu::start_metrics_polling(handle);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            toggle_devtools,
            open_devtools,
            close_devtools,
            commands::get_gpu_info,
            commands::get_gpu_metrics,
            commands::get_system_info,
            commands::get_all_metrics,
            commands::start_model,
            commands::stop_model,
            commands::get_model_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

