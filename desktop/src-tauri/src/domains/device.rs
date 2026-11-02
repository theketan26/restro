use axum::{
    extract::{State, Path},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Arc};
use jsonwebtoken::{EncodingKey, DecodingKey, Header, Validation, encode, decode};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::device::{ApiResponse, DeviceInfo};
use crate::server::AppState;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConnectedDeviceInfo {
    pub id: String,
    pub name: String,
    pub device_type: String,
    pub ip_address: String,
    pub port: u16,
    pub version: String,
    pub last_seen: String,
    pub user_name: Option<String>,
    pub user_email: Option<String>,
    pub user_role: Option<String>,
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

#[derive(Debug, Deserialize)]
pub struct ConnectPayload {
    pub mobile: ConnectedDeviceInfo,
}

#[derive(Debug, Deserialize)]
pub struct SetMasterNamePayload {
    pub master_name: String,
}

#[derive(Debug, Deserialize)]
pub struct SetupPayload {
    pub master_name: String,
    pub admin_name: String,
    pub admin_email: String,
    #[allow(dead_code)]
    pub admin_password: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SetupStatusResponse {
    pub setup_completed: bool,
    pub master_name: String,
    pub has_admin: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateAuthRequestPayload {
    pub mobile: ConnectedDeviceInfo,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

pub fn settings_file_path() -> PathBuf {
    let appdata = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());

    if cfg!(windows) {
        PathBuf::from(appdata).join("Stackrise").join("settings.json")
    } else {
        PathBuf::from(appdata).join(".stackrise").join("settings.json")
    }
}

pub fn is_setup_completed() -> bool {
    let path = settings_file_path();
    if let Ok(contents) = fs::read_to_string(&path) {
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&contents) {
            return value.get("setup_completed").and_then(|v| v.as_bool()).unwrap_or(false);
        }
    }
    false
}

pub fn save_settings_data(master_name: &str, setup_completed: bool) -> Result<(), String> {
    let path = settings_file_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let payload = serde_json::json!({
        "master_name": master_name,
        "setup_completed": setup_completed
    });
    fs::write(&path, payload.to_string())
        .map_err(|err| err.to_string())
}

pub fn load_master_name(default_name: &str) -> String {
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

pub fn save_master_name(master_name: &str) -> Result<(), String> {
    let setup_completed = is_setup_completed();
    save_settings_data(master_name, setup_completed)
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/device/info", get(get_device_info))
        .route("/api/device/discover", get(get_device_info)) // Alias for discovery
        .route("/api/health", get(health_check))
        .route("/api/device/connect", post(connect_device))
        .route("/api/device/disconnect", post(disconnect_device))
        .route("/api/device/connected", get(get_connected_devices))
        .route("/api/device/connected/:id/disconnect", post(disconnect_device_by_id))
        .route("/api/settings/master-name", get(get_master_name).post(set_master_name))
        .route("/api/setup/status", get(get_setup_status))
        .route("/api/setup", post(complete_setup))
        .route("/api/device/auth-request", post(create_auth_request))
        .route("/api/device/auth-requests", get(list_auth_requests))
        .route("/api/device/auth-request/:id", get(get_auth_request))
        .route("/api/device/auth-request/:id/approve", post(approve_auth_request))
        .route("/api/device/auth-request/:id/deny", post(deny_auth_request))
}

async fn get_setup_status(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ApiResponse<SetupStatusResponse>>) {
    let device_info = state.device_info.lock().unwrap().clone();
    let users = state.users.lock().unwrap();
    let has_admin = users.iter().any(|u| u.role.to_lowercase() == "admin");
    let is_completed = is_setup_completed() && has_admin;
    (
        StatusCode::OK,
        Json(ApiResponse::ok(SetupStatusResponse {
            setup_completed: is_completed,
            master_name: device_info.master_name,
            has_admin,
        })),
    )
}

async fn complete_setup(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SetupPayload>,
) -> (StatusCode, Json<ApiResponse<crate::domains::user::User>>) {
    let trimmed_master = payload.master_name.trim().to_string();
    let admin_name = payload.admin_name.trim().to_string();
    let admin_email = payload.admin_email.trim().to_lowercase();

    if trimmed_master.is_empty() || admin_name.is_empty() || admin_email.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("Master name, admin name, and email are required.".to_string())),
        );
    }

    // Update master name in state & settings.json
    let mut device_info = state.device_info.lock().unwrap();
    device_info.master_name = trimmed_master.clone();
    let _ = save_settings_data(&trimmed_master, true);

    // Create Admin user
    let mut users = state.users.lock().unwrap();
    users.clear();

    let admin_user = crate::domains::user::User {
        id: Uuid::new_v4().to_string(),
        name: admin_name,
        email: admin_email,
        role: "admin".to_string(),
        created_at: Utc::now().to_rfc3339(),
        active: true,
    };
    users.push(admin_user.clone());

    (
        StatusCode::OK,
        Json(ApiResponse::ok(admin_user)),
    )
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
    // Require JWT provided by mobile client in `cookie` header
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

    let token_data = match decode::<Claims>(&token, &DecodingKey::from_secret(secret), &Validation::default()) {
        Ok(c) => c,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::error("Invalid authentication token".to_string())),
            );
        }
    };

    let user_email = token_data.claims.sub.trim().to_lowercase();
    let users = state.users.lock().unwrap();
    let user = users
        .iter()
        .find(|u| u.email.trim().to_lowercase() == user_email);
    let user_name = user.map(|u| u.name.clone());
    let user_role = user.map(|u| u.role.clone());

    let mut devices = state.connected_devices.lock().unwrap();
    let now = Utc::now().to_rfc3339();
    let mut connected = payload.mobile.clone();
    connected.last_seen = now.clone();
    connected.user_email = Some(user_email);
    connected.user_name = user_name;
    connected.user_role = user_role;

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

async fn create_auth_request(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateAuthRequestPayload>,
) -> (StatusCode, Json<ApiResponse<String>>) {
    let clean_email = payload.email.trim().to_lowercase();
    // Validate that email exists in users (case-insensitive & trimmed)
    let users = state.users.lock().unwrap();
    let found = users.iter().any(|u| u.email.trim().to_lowercase() == clean_email);
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
        email: clean_email,
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
    Json(payload): Json<ConnectPayload>,
) -> (StatusCode, Json<ApiResponse<String>>) {
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

/// Handler: Disconnect a connected mobile device by ID (called from desktop)
async fn disconnect_device_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> (StatusCode, Json<ApiResponse<bool>>) {
    let mut devices = state.connected_devices.lock().unwrap();
    let before = devices.len();
    devices.retain(|device| device.id != id);
    let removed = devices.len() < before;

    (
        StatusCode::OK,
        Json(ApiResponse::ok(removed)),
    )
}
