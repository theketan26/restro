use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, put, delete},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{fs, path::PathBuf, sync::{Arc, Mutex}};
use tower_http::cors::CorsLayer;
use jsonwebtoken::{EncodingKey, DecodingKey, Header, Validation, encode, decode};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::device::{ApiResponse, DeviceInfo};
use crate::mdns_service::{get_local_ip, register_mdns_service};
use uuid::Uuid;

const SERVER_PORT: u16 = 2326;

/// Connected mobile device metadata
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConnectedDeviceInfo {
    pub id: String,
    pub name: String,
    pub device_type: String,
    pub ip_address: String,
    pub port: u16,
    pub version: String,
    pub last_seen: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AuthStatus {
    Pending,
    Approved,
    Denied,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AuthRequest {
    pub id: String,
    pub email: String,
    pub mobile: ConnectedDeviceInfo,
    pub status: AuthStatus,
    pub created_at: String,
    pub token: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub created_at: String,
    pub active: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserPayload {
    pub name: String,
    pub email: String,
    pub role: String,
    pub active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserPayload {
    pub name: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
    pub active: Option<bool>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub category: String,
    pub available: bool,
    pub created_at: String,
    pub image: Option<String>,
    pub taste_profile: Option<String>,
    pub ingredients: Option<String>,
    pub diet: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OrderItem {
    pub item_id: String,
    pub name: String,
    pub price: f64,
    pub quantity: usize,
    pub note: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub token_id: String,
    pub table_number: String,
    pub items: Vec<OrderItem>,
    pub created_at: i64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OrderToken {
    pub id: String,
    pub table_number: String,
    pub status: String,
    pub payment_method: Option<String>,
    pub amount_paid: Option<f64>,
    pub created_at: i64,
    pub fulfilled_at: Option<i64>,
    pub chef_name: Option<String>,
    pub chef_status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderPayload {
    pub id: String,
    pub token_id: String,
    pub table_number: String,
    pub items: Vec<OrderItem>,
    pub created_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderTokenPayload {
    pub id: String,
    pub table_number: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct FulfillOrderTokenPayload {
    pub payment_method: String,
    pub amount_paid: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderTokenPayload {
    pub chef_name: Option<String>,
    pub chef_status: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RestaurantTable {
    pub id: String,
    pub name: String,
    pub created_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateTablePayload {
    pub id: String,
    pub name: String,
    pub created_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTablePayload {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateItemPayload {
    pub name: String,
    pub description: String,
    pub price: f64,
    pub category: String,
    pub available: bool,
    pub image: Option<String>,
    pub taste_profile: Option<String>,
    pub ingredients: Option<String>,
    pub diet: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateItemPayload {
    pub name: Option<String>,
    pub description: Option<String>,
    pub price: Option<f64>,
    pub category: Option<String>,
    pub available: Option<bool>,
    pub image: Option<String>,
    pub taste_profile: Option<String>,
    pub ingredients: Option<String>,
    pub diet: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListItemsParams {
    pub search: Option<String>,
    pub category: Option<String>,
    pub page: Option<usize>,
    pub limit: Option<usize>,
    pub diet: Option<String>,
}

#[derive(Serialize)]
pub struct PaginatedItemsResponse {
    pub items: Vec<Item>,
    pub total: usize,
    pub page: usize,
    pub limit: usize,
    pub total_unfiltered: usize,
}

#[derive(Debug, Deserialize)]
pub struct ConnectPayload {
    pub mobile: ConnectedDeviceInfo,
}

#[derive(Debug, Deserialize)]
pub struct SetMasterNamePayload {
    pub master_name: String,
}

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

fn settings_file_path() -> PathBuf {
    let appdata = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());

    if cfg!(windows) {
        PathBuf::from(appdata).join("Stackrise").join("settings.json")
    } else {
        PathBuf::from(appdata).join(".stackrise").join("settings.json")
    }
}

fn load_master_name(default_name: &str) -> String {
    let path = settings_file_path();
    if let Ok(contents) = fs::read_to_string(&path) {
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&contents) {
            if let Some(master_name) = value.get("master_name").and_then(|v| v.as_str()) {
                return master_name.to_string();
            }
        }
    }
    default_name.to_string()
}

fn save_master_name(master_name: &str) -> Result<(), String> {
    let path = settings_file_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let payload = serde_json::json!({ "master_name": master_name });
    fs::write(&path, payload.to_string())
        .map_err(|err| err.to_string())
}

fn images_directory_path() -> PathBuf {
    let appdata = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());

    if cfg!(windows) {
        PathBuf::from(appdata).join("Stackrise").join("images")
    } else {
        PathBuf::from(appdata).join(".stackrise").join("images")
    }
}

fn save_uploaded_image(base64_str: &str) -> Result<String, String> {
    use base64::{Engine as _, engine::general_purpose};

    let raw_base64 = if base64_str.contains(',') {
        base64_str.split(',').nth(1).ok_or("Invalid data URL")?
    } else {
        base64_str
    };

    let ext = if base64_str.starts_with("data:image/jpeg") || base64_str.starts_with("data:image/jpg") {
        "jpg"
    } else if base64_str.starts_with("data:image/gif") {
        "gif"
    } else if base64_str.starts_with("data:image/webp") {
        "webp"
    } else {
        "png"
    };

    let decoded = general_purpose::STANDARD
        .decode(raw_base64.trim())
        .map_err(|e| format!("Failed to decode base64: {e}"))?;

    let dir = images_directory_path();
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create images directory: {e}"))?;

    let filename = format!("{}.{}", Uuid::new_v4(), ext);
    let filepath = dir.join(&filename);

    fs::write(&filepath, decoded).map_err(|e| format!("Failed to write image file: {e}"))?;

    Ok(format!("/api/items/images/{}", filename))
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

    // Create shared state
    let default_admin = User {
        id: "default-admin-id".to_string(),
        name: "Default Admin".to_string(),
        email: "admin@stackrise.com".to_string(),
        role: "admin".to_string(),
        created_at: Utc::now().to_rfc3339(),
        active: true,
    };
    let default_chef = User {
        id: "default-chef-id".to_string(),
        name: "Chef Gordon".to_string(),
        email: "chef.gordon@stackrise.com".to_string(),
        role: "chef".to_string(),
        created_at: Utc::now().to_rfc3339(),
        active: true,
    };
    // Seed some default items
    let default_items = vec![
        Item {
            id: "pizza-1".to_string(),
            name: "Margherita Pizza".to_string(),
            description: "Classic Neapolitan pizza with tomato sauce, fresh mozzarella, and basil.".to_string(),
            price: 12.99,
            category: "Mains".to_string(),
            available: true,
            created_at: Utc::now().to_rfc3339(),
            image: None,
            taste_profile: Some("Savory, Cheesy".to_string()),
            ingredients: Some("Dough, Tomato Sauce, Mozzarella, Basil, Olive Oil".to_string()),
            diet: Some("veg".to_string()),
        },
        Item {
            id: "salad-1".to_string(),
            name: "Caesar Salad".to_string(),
            description: "Crisp romaine lettuce, garlic croutons, Parmesan, and Caesar dressing.".to_string(),
            price: 8.99,
            category: "Starters".to_string(),
            available: true,
            created_at: Utc::now().to_rfc3339(),
            image: None,
            taste_profile: Some("Savory, Garlic".to_string()),
            ingredients: Some("Romaine Lettuce, Croutons, Parmesan Cheese, Caesar Dressing".to_string()),
            diet: Some("non-veg".to_string()),
        },
        Item {
            id: "dessert-1".to_string(),
            name: "Tiramisu".to_string(),
            description: "Traditional Italian dessert with ladyfingers, espresso, and mascarpone.".to_string(),
            price: 6.99,
            category: "Desserts".to_string(),
            available: true,
            created_at: Utc::now().to_rfc3339(),
            image: None,
            taste_profile: Some("Sweet, Coffee".to_string()),
            ingredients: Some("Ladyfingers, Espresso Coffee, Mascarpone, Cocoa Powder".to_string()),
            diet: Some("egg".to_string()),
        },
    ];
    let mut default_tables = Vec::new();
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;
    for i in 1..=12 {
        default_tables.push(RestaurantTable {
            id: format!("table-{i}"),
            name: format!("Table {i}"),
            created_at: now_ms + i as i64,
        });
    }

    let state = Arc::new(AppState {
        device_info: Mutex::new(device_info.clone()),
        connected_devices: Mutex::new(Vec::new()),
        users: Mutex::new(vec![default_admin, default_chef]),
        auth_requests: Mutex::new(Vec::new()),
        items: Mutex::new(default_items),
        orders: Mutex::new(Vec::new()),
        order_tokens: Mutex::new(Vec::new()),
        tables: Mutex::new(default_tables),
    });

    // Build router with routes
    let app = Router::new()
        .route("/api/device/info", get(get_device_info))
        .route("/api/device/discover", get(get_device_info)) // Alias for discovery
        .route("/api/health", get(health_check))
        .route("/api/device/connect", post(connect_device))
        .route("/api/device/disconnect", post(disconnect_device))
        .route("/api/device/connected", get(get_connected_devices))
        .route("/api/settings/master-name", get(get_master_name).post(set_master_name))
        .route("/api/device/auth-request", post(create_auth_request))
        .route("/api/device/auth-requests", get(list_auth_requests))
        .route("/api/device/auth-request/:id", get(get_auth_request))
        .route("/api/device/auth-request/:id/approve", post(approve_auth_request))
        .route("/api/device/auth-request/:id/deny", post(deny_auth_request))
        .route("/api/users", get(list_users).post(create_user))
        .route("/api/users/:id", get(get_user).put(update_user).delete(delete_user))
        .route("/api/items", get(list_items).post(create_item))
        .route("/api/items/:id", get(get_item).put(update_item).delete(delete_item))
        .route("/api/items/images/:filename", get(serve_image))
        .route("/api/data/send", post(send_data))
        .route("/api/data/receive", get(receive_data))
        .route("/api/orders", get(list_orders).post(create_order))
        .route("/api/order-tokens", get(list_order_tokens).post(create_order_token))
        .route("/api/order-tokens/:id", put(update_order_token))
        .route("/api/order-tokens/:id/fulfill", post(fulfill_order_token))
        .route("/api/tables", get(list_tables).post(create_table))
        .route("/api/tables/:id", put(update_table).delete(delete_table))
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Run server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", SERVER_PORT))
        .await?;

    axum::serve(listener, app).await?;

    Ok(())
}

/// Handler: Get device information
async fn get_device_info(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<DeviceInfo>>) {
    let device_info = state.device_info.lock().unwrap().clone();
    (
        StatusCode::OK,
        Json(ApiResponse::ok(device_info)),
    )
}

async fn get_master_name(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    let device_info = state.device_info.lock().unwrap().clone();
    (
        StatusCode::OK,
        Json(ApiResponse::ok(device_info.master_name)),
    )
}

async fn set_master_name(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SetMasterNamePayload>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    let mut device_info = state.device_info.lock().unwrap();
    let trimmed = payload.master_name.trim().to_string();
    let next_name = if trimmed.is_empty() { device_info.name.clone() } else { trimmed };
    device_info.master_name = next_name.clone();

    if let Err(err) = save_master_name(&next_name) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("Failed to save settings: {err}"))),
        );
    }

    (
        StatusCode::OK,
        Json(ApiResponse::ok(next_name)),
    )
}

/// Handler: Health check
async fn health_check() -> (StatusCode, &'static str) {
    (StatusCode::OK, "OK")
}
/// Handler: Connect a mobile device to the desktop
async fn connect_device(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<ConnectPayload>,
) -> (StatusCode, Json<ApiResponse<ConnectedDeviceInfo>>) {
    // Require JWT provided by mobile client in `x-jwt` header
    let secret = b"stackrise-dev-secret";
    let token = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(';').find_map(|p| {
            let t = p.trim();
            if t.starts_with("jwt=") { Some(t.trim_start_matches("jwt=").to_string()) } else { None }
        }))
        .unwrap_or_default();

    if token.is_empty() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::error("Missing authentication token".to_string())),
        );
    }

    if decode::<Claims>(&token, &DecodingKey::from_secret(secret), &Validation::default()).is_err() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::error("Invalid authentication token".to_string())),
        );
    }

    let mut devices = state.connected_devices.lock().unwrap();
    let now = Utc::now().to_rfc3339();
    let mut connected = payload.mobile.clone();
    connected.last_seen = now.clone();

    if let Some(existing) = devices.iter_mut().find(|d| d.id == connected.id) {
        *existing = connected.clone();
    } else {
        devices.push(connected.clone());
    }

    (
        StatusCode::OK,
        Json(ApiResponse::ok(connected)),
    )
}

#[derive(Debug, Deserialize)]
pub struct CreateAuthRequestPayload {
    pub mobile: ConnectedDeviceInfo,
    pub email: String,
}

async fn create_auth_request(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateAuthRequestPayload>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    // Validate that email exists in users
    let users = state.users.lock().unwrap();
    let found = users.iter().any(|u| u.email == payload.email);
    if !found {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("User not found".to_string())),
        );
    }

    let mut auths = state.auth_requests.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let req = AuthRequest {
        id: id.clone(),
        email: payload.email,
        mobile: payload.mobile,
        status: AuthStatus::Pending,
        created_at: Utc::now().to_rfc3339(),
        token: None,
    };
    auths.push(req);

    (
        StatusCode::CREATED,
        Json(ApiResponse::ok(id)),
    )
}

async fn list_auth_requests(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<Vec<AuthRequest>>>) {
    let auths = state.auth_requests.lock().unwrap();
    (
        StatusCode::OK,
        Json(ApiResponse::ok(auths.clone())),
    )
}

async fn get_auth_request(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<Option<AuthRequest>>>) {
    let auths = state.auth_requests.lock().unwrap();
    let found = auths.iter().cloned().find(|a| a.id == id);
    (
        StatusCode::OK,
        Json(ApiResponse::ok(found)),
    )
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

async fn approve_auth_request(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<Option<String>>>) {
    let mut auths = state.auth_requests.lock().unwrap();
    if let Some(req) = auths.iter_mut().find(|a| a.id == id) {
        // create token
        let secret = b"stackrise-dev-secret";
        let exp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize
            + 60 * 60 * 24 * 7; // 7 days
        let claims = Claims {
            sub: req.email.clone(),
            exp,
        };

        let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret)).unwrap_or_default();
        req.status = AuthStatus::Approved;
        req.token = Some(token.clone());

        return (
            StatusCode::OK,
            Json(ApiResponse::ok(Some(token))),
        );
    }

    (
        StatusCode::NOT_FOUND,
        Json(ApiResponse::ok(None)),
    )
}

async fn deny_auth_request(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<bool>>) {
    let mut auths = state.auth_requests.lock().unwrap();
    if let Some(req) = auths.iter_mut().find(|a| a.id == id) {
        req.status = AuthStatus::Denied;
        return (
            StatusCode::OK,
            Json(ApiResponse::ok(true)),
        );
    }

    (
        StatusCode::NOT_FOUND,
        Json(ApiResponse::ok(false)),
    )
}

/// Handler: Disconnect a mobile device from the desktop
async fn disconnect_device(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<ConnectPayload>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    // Require JWT
    let secret = b"stackrise-dev-secret";
    let token = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(';').find_map(|p| {
            let t = p.trim();
            if t.starts_with("jwt=") { Some(t.trim_start_matches("jwt=").to_string()) } else { None }
        }))
        .unwrap_or_default();

    if token.is_empty() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::error("Missing authentication token".to_string())),
        );
    }

    if decode::<Claims>(&token, &DecodingKey::from_secret(secret), &Validation::default()).is_err() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::error("Invalid authentication token".to_string())),
        );
    }

    let mut devices = state.connected_devices.lock().unwrap();
    devices.retain(|device| device.id != payload.mobile.id);

    (
        StatusCode::OK,
        Json(ApiResponse::ok("Disconnected".to_string())),
    )
}

/// Handler: Return connected mobile devices
async fn get_connected_devices(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<Vec<ConnectedDeviceInfo>>>) {
    let devices = state.connected_devices.lock().unwrap();
    (
        StatusCode::OK,
        Json(ApiResponse::ok(devices.clone())),
    )
}

#[derive(Debug, Deserialize)]
pub struct ListUsersParams {
    pub search: Option<String>,
    pub role: Option<String>,
    pub page: Option<usize>,
    pub limit: Option<usize>,
    pub status: Option<String>,
}

#[derive(Serialize)]
pub struct PaginatedUsersResponse {
    pub users: Vec<User>,
    pub total: usize,
    pub page: usize,
    pub limit: usize,
}

/// Handler: List users
async fn list_users(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListUsersParams>,
) -> (StatusCode, Json<ApiResponse<PaginatedUsersResponse>>) {
    // Validate limit parameter is not less than 5
    if let Some(limit) = params.limit {
        if limit < 5 {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("Page size (limit) must be at least 5.".to_string())),
            );
        }
    }

    let users = state.users.lock().unwrap();
    let mut filtered_users: Vec<User> = users.clone();

    // 1. Filter by role
    if let Some(ref role) = params.role {
        if !role.is_empty() && role != "all" {
            filtered_users.retain(|u| u.role.to_lowercase() == role.to_lowercase());
        }
    }

    // Filter by status (active / inactive / all)
    // Default is "active" if status is not specified
    let status_filter = params.status.clone().unwrap_or_else(|| "active".to_string());
    if status_filter == "active" {
        filtered_users.retain(|u| u.active);
    } else if status_filter == "inactive" {
        filtered_users.retain(|u| !u.active);
    }

    // 2. Filter by search (name or email, case-insensitive)
    if let Some(ref search) = params.search {
        if !search.is_empty() {
            let search_lower = search.to_lowercase();
            filtered_users.retain(|u| {
                u.name.to_lowercase().contains(&search_lower)
                    || u.email.to_lowercase().contains(&search_lower)
            });
        }
    }

    // 3. Total count before pagination
    let total = filtered_users.len();

    // 4. Pagination
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20);

    let start = if page > 0 { (page - 1) * limit } else { 0 };
    let paginated_users = if start < filtered_users.len() {
        let end = std::cmp::min(start + limit, filtered_users.len());
        filtered_users[start..end].to_vec()
    } else {
        Vec::new()
    };

    (
        StatusCode::OK,
        Json(ApiResponse::ok(PaginatedUsersResponse {
            users: paginated_users,
            total,
            page,
            limit,
        })),
    )
}

/// Handler: Create user
async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserPayload>,
) -> (StatusCode, Json<ApiResponse<User>>) {
    if payload.role.to_lowercase() == "admin" {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("Cannot create a user with the Admin role.".to_string())),
        );
    }

    let mut users = state.users.lock().unwrap();
    let user = User {
        id: Uuid::new_v4().to_string(),
        name: payload.name,
        email: payload.email,
        role: payload.role,
        created_at: Utc::now().to_rfc3339(),
        active: payload.active.unwrap_or(true),
    };
    users.push(user.clone());

    (
        StatusCode::CREATED,
        Json(ApiResponse::ok(user)),
    )
}

/// Handler: Get single user
async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<Option<User>>>) {
    let users = state.users.lock().unwrap();
    let found = users.iter().cloned().find(|u| u.id == id);
    (
        StatusCode::OK,
        Json(ApiResponse::ok(found)),
    )
}

/// Handler: Update user
async fn update_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateUserPayload>,
) -> (StatusCode, Json<ApiResponse<Option<User>>>) {
    let mut users = state.users.lock().unwrap();
    if let Some(existing) = users.iter_mut().find(|u| u.id == id) {
        if let Some(ref role) = payload.role {
            if role.to_lowercase() == "admin" && existing.role.to_lowercase() != "admin" {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse::error("Cannot promote a user to the Admin role.".to_string())),
                );
            }
            if existing.role.to_lowercase() == "admin" && role.to_lowercase() != "admin" {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse::error("Cannot demote an Admin user.".to_string())),
                );
            }
        }

        if let Some(name) = payload.name {
            existing.name = name;
        }
        if let Some(email) = payload.email {
            existing.email = email;
        }
        if let Some(role) = payload.role {
            existing.role = role;
        }
        if let Some(active) = payload.active {
            existing.active = active;
        }

        return (
            StatusCode::OK,
            Json(ApiResponse::ok(Some(existing.clone()))),
        );
    }

    (
        StatusCode::NOT_FOUND,
        Json(ApiResponse::ok(None)),
    )
}

/// Handler: Delete user
async fn delete_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    let mut users = state.users.lock().unwrap();
    let before = users.len();
    users.retain(|u| u.id != id);
    if users.len() < before {
        (
            StatusCode::OK,
            Json(ApiResponse::ok("Deleted".to_string())),
        )
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error("User not found".to_string())),
        )
    }
}

/// Handler: List items
async fn list_items(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListItemsParams>,
) -> (StatusCode, Json<ApiResponse<PaginatedItemsResponse>>) {
    let items = state.items.lock().unwrap();
    let mut filtered_items: Vec<Item> = items.clone();

    // 1. Filter by category
    if let Some(ref category) = params.category {
        if !category.is_empty() && category != "all" {
            filtered_items.retain(|item| item.category.to_lowercase() == category.to_lowercase());
        }
    }

    // Filter by diet (veg / non-veg / egg)
    if let Some(ref diet) = params.diet {
        if !diet.is_empty() && diet != "all" {
            filtered_items.retain(|item| {
                item.diet.as_ref().map(|d| d.to_lowercase() == diet.to_lowercase()).unwrap_or(false)
            });
        }
    }

    // 2. Filter by search (name, description, taste profile, or ingredients, case-insensitive)
    if let Some(ref search) = params.search {
        if !search.is_empty() {
            let search_lower = search.to_lowercase();
            filtered_items.retain(|item| {
                item.name.to_lowercase().contains(&search_lower)
                    || item.description.to_lowercase().contains(&search_lower)
                    || item.taste_profile.as_ref().map(|tp| tp.to_lowercase().contains(&search_lower)).unwrap_or(false)
                    || item.ingredients.as_ref().map(|ing| ing.to_lowercase().contains(&search_lower)).unwrap_or(false)
            });
        }
    }

    // 3. Total count before pagination
    let total = filtered_items.len();

    // 4. Pagination
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20);

    let start = if page > 0 { (page - 1) * limit } else { 0 };
    let paginated_items = if start < filtered_items.len() {
        let end = std::cmp::min(start + limit, filtered_items.len());
        filtered_items[start..end].to_vec()
    } else {
        Vec::new()
    };

    let total_unfiltered = items.len();

    (
        StatusCode::OK,
        Json(ApiResponse::ok(PaginatedItemsResponse {
            items: paginated_items,
            total,
            page,
            limit,
            total_unfiltered,
        })),
    )
}

/// Handler: Create item
async fn create_item(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateItemPayload>,
) -> (StatusCode, Json<ApiResponse<Item>>) {
    let mut items = state.items.lock().unwrap();

    let image_url = if let Some(ref b64) = payload.image {
        save_uploaded_image(b64).ok()
    } else {
        None
    };

    let item = Item {
        id: Uuid::new_v4().to_string(),
        name: payload.name,
        description: payload.description,
        price: payload.price,
        category: payload.category,
        available: payload.available,
        created_at: Utc::now().to_rfc3339(),
        image: image_url,
        taste_profile: payload.taste_profile,
        ingredients: payload.ingredients,
        diet: Some(payload.diet.unwrap_or_else(|| "veg".to_string())),
    };
    items.push(item.clone());

    (
        StatusCode::CREATED,
        Json(ApiResponse::ok(item)),
    )
}

/// Handler: Get single item
async fn get_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<Option<Item>>>) {
    let items = state.items.lock().unwrap();
    let found = items.iter().cloned().find(|item| item.id == id);
    (
        StatusCode::OK,
        Json(ApiResponse::ok(found)),
    )
}

/// Handler: Update item
async fn update_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateItemPayload>,
) -> (StatusCode, Json<ApiResponse<Option<Item>>>) {
    let mut items = state.items.lock().unwrap();
    if let Some(existing) = items.iter_mut().find(|item| item.id == id) {
        if let Some(name) = payload.name {
            existing.name = name;
        }
        if let Some(description) = payload.description {
            existing.description = description;
        }
        if let Some(price) = payload.price {
            existing.price = price;
        }
        if let Some(category) = payload.category {
            existing.category = category;
        }
        if let Some(available) = payload.available {
            existing.available = available;
        }
        if let Some(image_b64) = payload.image {
            if let Ok(url) = save_uploaded_image(&image_b64) {
                existing.image = Some(url);
            }
        }
        if let Some(taste_profile) = payload.taste_profile {
            existing.taste_profile = Some(taste_profile);
        }
        if let Some(ingredients) = payload.ingredients {
            existing.ingredients = Some(ingredients);
        }
        if let Some(diet) = payload.diet {
            existing.diet = Some(diet);
        }

        return (
            StatusCode::OK,
            Json(ApiResponse::ok(Some(existing.clone()))),
        );
    }

    (
        StatusCode::NOT_FOUND,
        Json(ApiResponse::ok(None)),
    )
}

async fn serve_image(
    Path(filename): Path<String>,
) -> impl axum::response::IntoResponse {
    let dir = images_directory_path();
    let filepath = dir.join(&filename);

    match fs::read(&filepath) {
        Ok(bytes) => {
            let extension = filepath.extension().and_then(|ext| ext.to_str()).unwrap_or("");
            let content_type = match extension.to_lowercase().as_str() {
                "jpg" | "jpeg" => "image/jpeg",
                "gif" => "image/gif",
                "webp" => "image/webp",
                _ => "image/png",
            };

            (
                StatusCode::OK,
                [(axum::http::header::CONTENT_TYPE, content_type)],
                bytes,
            ).into_response()
        }
        Err(_) => (
            StatusCode::NOT_FOUND,
            "Image not found",
        ).into_response(),
    }
}

/// Handler: Delete item
async fn delete_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    let mut items = state.items.lock().unwrap();
    let before = items.len();
    items.retain(|item| item.id != id);
    if items.len() < before {
        (
            StatusCode::OK,
            Json(ApiResponse::ok("Deleted".to_string())),
        )
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error("Item not found".to_string())),
        )
    }
}

/// Handler: Receive data from another device
/// This is a placeholder - implement based on your data needs
#[derive(serde::Deserialize)]
pub struct DataPayload {
    pub from_device: String,
    pub data_type: String,
    pub content: serde_json::Value,
}

#[derive(serde::Serialize)]
pub struct DataResponse {
    pub status: String,
    pub message: String,
}

async fn send_data(
    State(_state): State<Arc<AppState>>,
    Json(payload): Json<DataPayload>,
) -> (StatusCode, Json<ApiResponse<DataResponse>>) {
    tracing::info!(
        "Received data from {}: {}",
        payload.from_device,
        payload.data_type
    );

    (
        StatusCode::OK,
        Json(ApiResponse::ok(DataResponse {
            status: "received".to_string(),
            message: format!(
                "Data received from {}. Type: {}",
                payload.from_device, payload.data_type
            ),
        })),
    )
}
async fn receive_data(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<serde_json::Value>>) {
    let device_id = state.device_info.lock().unwrap().id.clone();
    (
        StatusCode::OK,
        Json(ApiResponse::ok(json!({
            "message": "No pending data",
            "device_id": device_id
        })) ),
    )
}

async fn list_orders(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<Vec<Order>>>) {
    let orders = state.orders.lock().unwrap();
    (StatusCode::OK, Json(ApiResponse::ok(orders.clone())))
}

async fn create_order(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateOrderPayload>,
) -> (StatusCode, Json<ApiResponse<Order>>) {
    let mut orders = state.orders.lock().unwrap();
    let order = Order {
        id: payload.id,
        token_id: payload.token_id,
        table_number: payload.table_number,
        items: payload.items,
        created_at: payload.created_at,
    };
    orders.push(order.clone());
    (StatusCode::CREATED, Json(ApiResponse::ok(order)))
}

async fn list_order_tokens(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<Vec<OrderToken>>>) {
    let tokens = state.order_tokens.lock().unwrap();
    (StatusCode::OK, Json(ApiResponse::ok(tokens.clone())))
}

async fn create_order_token(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateOrderTokenPayload>,
) -> (StatusCode, Json<ApiResponse<OrderToken>>) {
    let mut tokens = state.order_tokens.lock().unwrap();
    let token = OrderToken {
        id: payload.id,
        table_number: payload.table_number,
        status: payload.status,
        payment_method: None,
        amount_paid: None,
        created_at: payload.created_at,
        fulfilled_at: None,
        chef_name: None,
        chef_status: None,
    };
    tokens.push(token.clone());
    (StatusCode::CREATED, Json(ApiResponse::ok(token)))
}

async fn fulfill_order_token(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<FulfillOrderTokenPayload>,
) -> (StatusCode, Json<ApiResponse<Option<OrderToken>>>) {
    let mut tokens = state.order_tokens.lock().unwrap();
    if let Some(token) = tokens.iter_mut().find(|t| t.id == id) {
        token.status = "fulfilled".to_string();
        token.payment_method = Some(payload.payment_method);
        token.amount_paid = Some(payload.amount_paid);
        token.fulfilled_at = Some(
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as i64,
        );
        return (StatusCode::OK, Json(ApiResponse::ok(Some(token.clone()))));
    }
    (StatusCode::NOT_FOUND, Json(ApiResponse::ok(None)))
}

async fn update_order_token(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateOrderTokenPayload>,
) -> (StatusCode, Json<ApiResponse<Option<OrderToken>>>) {
    let mut tokens = state.order_tokens.lock().unwrap();
    if let Some(token) = tokens.iter_mut().find(|t| t.id == id) {
        token.chef_name = payload.chef_name;
        token.chef_status = payload.chef_status;
        return (StatusCode::OK, Json(ApiResponse::ok(Some(token.clone()))));
    }
    (StatusCode::NOT_FOUND, Json(ApiResponse::ok(None)))
}

async fn list_tables(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<Vec<RestaurantTable>>>) {
    let tables = state.tables.lock().unwrap();
    (StatusCode::OK, Json(ApiResponse::ok(tables.clone())))
}

async fn create_table(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateTablePayload>,
) -> (StatusCode, Json<ApiResponse<RestaurantTable>>) {
    let mut tables = state.tables.lock().unwrap();
    let table = RestaurantTable {
        id: payload.id,
        name: payload.name,
        created_at: payload.created_at,
    };
    tables.push(table.clone());
    (StatusCode::CREATED, Json(ApiResponse::ok(table)))
}

async fn update_table(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTablePayload>,
) -> (StatusCode, Json<ApiResponse<Option<RestaurantTable>>>) {
    let mut tables = state.tables.lock().unwrap();
    if let Some(table) = tables.iter_mut().find(|t| t.id == id) {
        table.name = payload.name;
        return (StatusCode::OK, Json(ApiResponse::ok(Some(table.clone()))));
    }
    (StatusCode::NOT_FOUND, Json(ApiResponse::ok(None)))
}

async fn delete_table(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    let mut tables = state.tables.lock().unwrap();
    let before = tables.len();
    tables.retain(|t| t.id != id);
    if tables.len() < before {
        (StatusCode::OK, Json(ApiResponse::ok("Deleted".to_string())))
    } else {
        (StatusCode::NOT_FOUND, Json(ApiResponse::error("Table not found".to_string())))
    }
}
