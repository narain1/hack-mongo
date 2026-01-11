import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";
import { useColorOverrides } from "./store/colorOverrides";

// Initialize color overrides on app load
// Use requestAnimationFrame to ensure DOM is ready and zustand has rehydrated
requestAnimationFrame(() => {
  // Apply colors after zustand rehydration completes
  setTimeout(() => {
    useColorOverrides.getState().applyColors();
  }, 0);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

