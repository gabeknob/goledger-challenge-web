import axios from "axios";
import { toast } from "sonner";
import { clearCredentials, getCredentials } from "#/lib/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(config => {
  const credentials = getCredentials();
  if (credentials) {
    config.headers.Authorization = `Basic ${credentials}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      clearCredentials();
      toast.error("Invalid credentials. Please sign in again.");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
