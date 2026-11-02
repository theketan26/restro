#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod server;
mod device;
mod mdns_service;
mod domains;

use server::start_http_server;

fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Create a separate thread for the HTTP server
    std::thread::spawn(|| {
        // Create a new tokio runtime in this thread
        let rt = tokio::runtime::Runtime::new().expect("Failed to create runtime");
        rt.block_on(async {
            if let Err(e) = start_http_server().await {
                eprintln!("Server error: {}", e);
            }
        });
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

