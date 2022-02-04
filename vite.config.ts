import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [
        copy({
          hook: "writeBundle",
          targets: [
            { src: "./manifest.json", dest: "./dist/" },
            { src: "./DESCRIPTION.md", dest: "./dist/", rename: "README.md" },
            { src: "./icon.svg", dest: "./dist/" },
          ],
        }),
      ],
    }
  },
});
