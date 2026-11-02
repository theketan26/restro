use axum::{
    extract::{State, Path},
    http::StatusCode,
    routing::{get, put, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::device::ApiResponse;
use crate::server::AppState;

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

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/orders", get(list_orders).post(create_order))
        .route("/api/order-tokens", get(list_order_tokens).post(create_order_token))
        .route("/api/order-tokens/:id", put(update_order_token))
        .route("/api/order-tokens/:id/fulfill", post(fulfill_order_token))
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
