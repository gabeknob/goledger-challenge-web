import axios from "axios";
import { getEnv } from "#/lib/env";

function isBearerToken(value: string) {
  return value.startsWith("eyJ");
}

export const tmdbApi = axios.create({
  baseURL: "https://api.themoviedb.org/3",
});

tmdbApi.interceptors.request.use(config => {
  const tmdbKey = getEnv("VITE_TMDB_API_KEY").trim();

  if (!tmdbKey) {
    return config;
  }

  config.params = {
    ...config.params,
    include_adult: "false",
    language: "en-US",
    page: "1",
  };

  if (isBearerToken(tmdbKey)) {
    config.headers.Authorization = `Bearer ${tmdbKey}`;
    return config;
  }

  config.params.api_key = tmdbKey;
  return config;
});
