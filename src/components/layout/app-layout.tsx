import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarMobile } from "@/components/layout/sidebar-mobile";
import { Topbar } from "@/components/layout/topbar";

export function AppLayout() {
  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <Sidebar />
      <SidebarMobile />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
