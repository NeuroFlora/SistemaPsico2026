import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import { AuthProvider } from "./contexts/AuthContext.jsx"; // Import AuthProvider

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/*
      1. Add BrowserRouter to enable routing
      2. Add AuthProvider to make the authentication context available to the entire app
    */}
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
