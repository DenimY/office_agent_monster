import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    // Avoid clashing with other local apps on 5173
    port: 5188,
    strictPort: true,
    open: false,
  },
});
