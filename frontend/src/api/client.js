import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const serverBaseUrl = import.meta.env.VITE_SERVER_URL || apiBaseUrl.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rms_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const extractErrorMessage = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

export const extractFieldErrors = (error) => error?.response?.data?.errors || {};
