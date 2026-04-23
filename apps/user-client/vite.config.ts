import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig({
  plugins: [(uni as unknown as { default: () => any }).default()],
  server: {
    port: 5174,
    strictPort: true
  }
});
