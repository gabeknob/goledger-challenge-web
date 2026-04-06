#!/bin/sh
set -e

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_TMDB_API_KEY: "${VITE_TMDB_API_KEY}"
};
EOF

exec "$@"
