use axum::{
    extract::State,
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;

use crate::device::ApiResponse;
use crate::server::AppState;

#[derive(Deserialize)]
pub struct DataPayload {
    pub from_device: String,
    pub data_type: String,
    #[allow(dead_code)]
    pub content: serde_json::Value,
}

#[derive(Serialize)]
pub struct DataResponse {
    pub status: String,
    pub message: String,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/data/send", post(send_data))
        .route("/api/data/receive", axum::routing::get(receive_data))
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
        }))),
    )
}
