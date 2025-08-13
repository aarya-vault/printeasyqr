import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// CRITICAL: Import HMR override to prevent connection errors
import "./lib/disable-vite-hmr";

createRoot(document.getElementById("root")!).render(<App />);
