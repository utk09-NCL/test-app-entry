import React from "react";
import ReactDOM from "react-dom/client";

import App from "./src/App";
import { ErrorBoundary } from "./src/components/organisms/ErrorBoundary";

import "./src/styles/global.scss";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
