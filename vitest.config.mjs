import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  root,
  test: {
    environment: "node"
  },
  resolve: {
    alias: {
      "@": src
    }
  }
});
