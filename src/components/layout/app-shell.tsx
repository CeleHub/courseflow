"use client";

import { useState } from "react";
import { Topbar } from "./topbar";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />
      <Sidebar isOpen={false} isMobile={false} />
      <main
        className={cn(
          "pt-14 min-h-screen",
          "md:pl-12 lg:pl-60",
          "px-4 md:px-5 lg:px-8 py-6 lg:py-6"
        )}
      >
        <div className="max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
