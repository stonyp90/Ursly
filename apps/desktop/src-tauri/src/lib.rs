//! Ursly Desktop - GPU Metrics Monitor
//! 
//! This library provides GPU metrics collection and monitoring capabilities
//! for the Ursly.io desktop application.

pub mod gpu;
pub mod system;
pub mod commands;

use tauri::Manager;

/// Configure and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Start the metrics polling in background
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                gpu::start_metrics_polling(handle);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
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

