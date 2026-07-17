import axios, { type AxiosError, type AxiosInstance } from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1"}:${process.env.NEXT_PUBLIC_API_BASE_PORT || "2326"}/api`;

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.request.use((config) => {
  // Attach bearer token when available
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => Promise.reject(error)
);
