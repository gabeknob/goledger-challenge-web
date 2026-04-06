#!/bin/sh
set -e

sed -i "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL}|g" /usr/share/nginx/html/env-config.js
sed -i "s|__VITE_TMDB_API_KEY__|${VITE_TMDB_API_KEY}|g" /usr/share/nginx/html/env-config.js

exec "$@"
