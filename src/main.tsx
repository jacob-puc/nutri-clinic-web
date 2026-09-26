import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/inter";
import "@fontsource-variable/public-sans";
import "./index.css";

import { App } from "@/app/App";

const container = document.getElementById("root");

if (!container) {
  throw new Error(
    'No se encontro el elemento #root en index.html. Revisa el entry point.',
  );
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
