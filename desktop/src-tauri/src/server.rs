use axum::Router;
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;

use crate::device::DeviceInfo;
use crate::mdns_service::{get_local_ip, register_mdns_service};

use crate::domains::device::{ConnectedDeviceInfo, AuthRequest, load_master_name};
use crate::domains::user::User;
use crate::domains::item::Item;
use crate::domains::order::{Order, OrderToken};
use crate::domains::table::RestaurantTable;

const SERVER_PORT: u16 = 2326;

/// Application state shared across handlers
pub struct AppState {
    pub device_info: Mutex<DeviceInfo>,
    pub connected_devices: Mutex<Vec<ConnectedDeviceInfo>>,
    pub users: Mutex<Vec<User>>,
    pub auth_requests: Mutex<Vec<AuthRequest>>,
    pub items: Mutex<Vec<Item>>,
    pub orders: Mutex<Vec<Order>>,
    pub order_tokens: Mutex<Vec<OrderToken>>,
    pub tables: Mutex<Vec<RestaurantTable>>,
}

/// Start the HTTP server with mDNS registration
pub async fn start_http_server() -> Result<(), Box<dyn std::error::Error>> {
    // Get local IP address
    let local_ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());

    // Create device info
    let mut device_info = DeviceInfo::new(
        hostname::get()
            .ok()
            .and_then(|h| h.into_string().ok())
            .unwrap_or_else(|| "Stackrise-Desktop".to_string()),
        local_ip.clone(),
        SERVER_PORT,
    );
    device_info.master_name = load_master_name(&device_info.name);

    // Register mDNS service
    let _mdns = register_mdns_service(
        &device_info.name,
        &device_info.name,
        &local_ip,
        SERVER_PORT,
    )
    .await
    .ok();

    tracing::info!("Starting HTTP server on {}:{}", local_ip, SERVER_PORT);

    let state = Arc::new(AppState {
        device_info: Mutex::new(device_info.clone()),
        connected_devices: Mutex::new(Vec::new()),
        users: Mutex::new(Vec::new()),
        auth_requests: Mutex::new(Vec::new()),
        items: Mutex::new(Vec::new()),
        orders: Mutex::new(Vec::new()),
        order_tokens: Mutex::new(Vec::new()),
        tables: Mutex::new(Vec::new()),
    });

    // Build router by merging all domain routers
    let app = Router::new()
        .merge(crate::domains::device::router())
        .merge(crate::domains::user::router())
        .merge(crate::domains::item::router())
        .merge(crate::domains::order::router())
        .merge(crate::domains::table::router())
        .merge(crate::domains::data::router())
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Run server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", SERVER_PORT))
        .await?;

    axum::serve(listener, app).await?;

    Ok(())
}
