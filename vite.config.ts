import { defineConfig } from "vite";

export default defineConfig({
  plugins: [], // No React plugin needed
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util", "@ffmpeg/core"], // Exclude FFmpeg from Vite's optimization
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp", // Required for SharedArrayBuffer
    },
  },
  worker: {
    format: "es", // Ensure workers use ES modules
  },
  // For use with GitHub pages.
  build: { outDir: "docs" },
  base: "./",
});
