use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Device information shared across the network
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    /// Unique device identifier
    pub id: String,
    /// Human-readable device name
    pub name: String,
    /// Display name shown to other devices
    #[serde(default)]
    pub master_name: String,
    /// Device type (Desktop, Mobile, etc.)
    pub device_type: String,
    /// IP address where the device is reachable
    pub ip_address: String,
    /// HTTP server port
    pub port: u16,
    /// Application version
    pub version: String,
}

impl DeviceInfo {
    /// Create new device info with a unique ID
    pub fn new(name: String, ip_address: String, port: u16) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: name.clone(),
            master_name: name,
            device_type: "Desktop".to_string(),
            ip_address,
            port,
            version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }

    /// Get the base URL for this device
    pub fn base_url(&self) -> String {
        format!("http://{}:{}", self.ip_address, self.port)
    }
}

/// Response wrapper for API endpoints
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}
