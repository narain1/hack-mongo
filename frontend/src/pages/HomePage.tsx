import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { HomeSearchInput } from "@/components/home/HomeSearchInput";
import { UserAvatars } from "@/components/home/UserAvatars";
import { PreviousChatsSidebar } from "@/components/home/PreviousChatsSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSavedSessions } from "@/services/chatSessionService";

function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Refresh session count when sidebar opens/closes to trigger re-render
  useEffect(() => {
    if (isSidebarOpen) {
      getSavedSessions();
    }
  }, [isSidebarOpen]);

  return (
    <div className="home-spotlight relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 z-30"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <PreviousChatsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex flex-col items-center gap-8 text-center">
        <Card className="w-full max-w-3xl border-0 bg-transparent shadow-none">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Travel Chat
              </h1>
            </div>
            <HomeSearchInput />
            <UserAvatars className="mt-2" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default HomePage;

