import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function printDropInInstructions(): Plugin {
  return {
    name: "print-drop-in",
    apply: "build",
    closeBundle() {
      console.log(`
crit.js is at dist/crit.js (self-contained IIFE, React bundled).

Load it in another app:

  1. Copy dist/crit.js into that app's public/static folder
       Vite / Next:  public/crit.js
       anywhere else: the directory you already serve as static files
  2. Add this before </body> (path must match the copy):
       <script src="/crit.js"></script>
     Next.js App Router: put that tag in the root layout.
     Next.js Pages:      <Script src="/crit.js" strategy="lazyOnload" />
  3. Serve the host over http(s), not file://. Reload. Toggle with
     ⌘⇧. (macOS) or Ctrl+Shift+. (Windows/Linux), or use the bottom tab.

Check the built file in this repo:

  python3 -m http.server 8765
  open http://127.0.0.1:8765/script-tag.html
`);
    },
  };
}

export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      plugins: [react()],
    };
  }

  return {
    plugins: [react(), printDropInInstructions()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    build: {
      lib: {
        entry: "src/main.tsx",
        name: "Crit",
        formats: ["iife"],
        fileName: () => "crit.js",
      },
      rollupOptions: {
        external: [],
      },
      copyPublicDir: false,
      cssCodeSplit: false,
      emptyOutDir: true,
    },
  };
});
