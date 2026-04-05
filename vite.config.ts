import { defineConfig } from "vitest/config";
import { devtools } from "@tanstack/devtools-vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/routeTree.gen.ts",
        "src/components/ui/**",
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/types/**",
      ],
    },
  },
});

export default config;
