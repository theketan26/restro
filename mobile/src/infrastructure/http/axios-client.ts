import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosError, type AxiosInstance } from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as typeof config.headers;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(error)
);
