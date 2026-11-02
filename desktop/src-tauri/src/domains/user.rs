use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::device::ApiResponse;
use crate::server::AppState;

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

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/users", get(list_users).post(create_user))
        .route("/api/users/:id", get(get_user).put(update_user).delete(delete_user))
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
    let mut users = state.users.lock().unwrap();
    if payload.role.to_lowercase() == "admin" {
        let has_admin = users.iter().any(|u| u.role.to_lowercase() == "admin");
        if has_admin {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("Cannot create additional Admin users.".to_string())),
            );
        }
    }
    let user = User {
        id: Uuid::new_v4().to_string(),
        name: payload.name.trim().to_string(),
        email: payload.email.trim().to_lowercase(),
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
            existing.name = name.trim().to_string();
        }
        if let Some(email) = payload.email {
            existing.email = email.trim().to_lowercase();
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
