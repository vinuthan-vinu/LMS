import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "../constants/config";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("lms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config || {};
    const isNetworkError = !error?.response;
    const canRetry = config.method === "get" && !config.__retriedOnce && isNetworkError;

    if (canRetry) {
      config.__retriedOnce = true;
      await new Promise((resolve) => setTimeout(resolve, 400));
      return api(config);
    }

    if (error?.code === "ECONNABORTED" || error.message?.toLowerCase().includes("timeout")) {
      error.message = "Request timed out. Please check your connection and try again.";
    }

    return Promise.reject(error);
  }
);

export default api;
