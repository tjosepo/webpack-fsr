import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { AppRouter } from "./AppRouter";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
