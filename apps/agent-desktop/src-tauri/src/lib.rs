//! Ursly Agent - GPU Metrics & AI Agent Monitor
//!
//! A lightweight desktop app for monitoring GPU metrics and system resources.

pub mod gpu;
pub mod system;
pub mod commands;

use tauri::{Manager, tray::TrayIconEvent};

// ============================================================================
// Window Commands
// ============================================================================

#[tauri::command]
fn show_window(window: tauri::Window) {
    if let Some(webview_window) = window.get_webview_window("main") {
        let _ = webview_window.show();
        let _ = webview_window.set_focus();
    }
}

#[tauri::command]
fn hide_window(window: tauri::Window) {
    if let Some(webview_window) = window.get_webview_window("main") {
        let _ = webview_window.hide();
    }
}

#[tauri::command]
fn toggle_window(window: tauri::Window) {
    if let Some(webview_window) = window.get_webview_window("main") {
        if webview_window.is_visible().unwrap_or(false) {
            let _ = webview_window.hide();
        } else {
            let _ = webview_window.show();
            let _ = webview_window.set_focus();
        }
    }
}

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
            // Start GPU metrics polling
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                gpu::start_metrics_polling(handle);
            });
            
            // Setup tray icon click handler
            let app_handle = app.handle().clone();
            if let Some(tray) = app.tray_by_id("main") {
                tray.on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                });
            }
            
            // Show window on startup for dev mode
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_window,
            hide_window,
            toggle_window,
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


