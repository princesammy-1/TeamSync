import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { PresenceProvider } from "./context/PresenceContext";
import { ChatProvider } from "./context/ChatContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <PresenceProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </PresenceProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
