import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AgentProvider } from "./context/AgentContext";
import { ChatProvider } from "./context/ChatContext";
import { useColorOverrides } from "./store/colorOverrides";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import DesignPage from "./pages/DesignPage";

function App() {
  const applyColors = useColorOverrides((state) => state.applyColors);

  // Ensure colors are applied when app mounts
  useEffect(() => {
    // Apply colors after component mount to ensure DOM is ready
    applyColors();
  }, [applyColors]);

  return (
    <BrowserRouter>
      <ChatProvider>
        <AgentProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/design" element={<DesignPage />} />
            </Routes>
          </div>
        </AgentProvider>
      </ChatProvider>
    </BrowserRouter>
  );
}

export default App;

