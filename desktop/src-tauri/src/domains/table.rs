use axum::{
    extract::{State, Path},
    http::StatusCode,
    routing::{get, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::device::ApiResponse;
use crate::server::AppState;

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

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/tables", get(list_tables).post(create_table))
        .route("/api/tables/:id", put(update_table).delete(delete_table))
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
