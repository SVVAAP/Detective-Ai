import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-cname",
      closeBundle() {
        // Copy CNAME file after build
        const cnamePath = resolve(__dirname, "CNAME");
        const distCnamePath = resolve(__dirname, "dist/CNAME");
        if (fs.existsSync(cnamePath)) {
          fs.copyFileSync(cnamePath, distCnamePath);
          console.log("✅ CNAME file copied to dist/");
        }
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 2000, // Handle warning on vendor.js bundle size
  },
  base: "https://visionx.svvaap.in/",
});
