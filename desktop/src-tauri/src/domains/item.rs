use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    response::IntoResponse,
    routing::{get},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Arc};
use uuid::Uuid;

use crate::device::ApiResponse;
use crate::server::AppState;

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

pub fn images_directory_path() -> PathBuf {
    let appdata = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());

    if cfg!(windows) {
        PathBuf::from(appdata).join("Stackrise").join("images")
    } else {
        PathBuf::from(appdata).join(".stackrise").join("images")
    }
}

pub fn save_uploaded_image(base64_str: &str) -> Result<String, String> {
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

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/items", get(list_items).post(create_item))
        .route("/api/items/:id", get(get_item).put(update_item).delete(delete_item))
        .route("/api/items/images/:filename", get(serve_image))
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
