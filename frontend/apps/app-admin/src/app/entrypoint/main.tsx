import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../router/router";
import { AppProviders } from "./app-providers";
import "../styles/index.css";

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
}
