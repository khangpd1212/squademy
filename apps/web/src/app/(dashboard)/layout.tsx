import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-(--dash-surface)">
      <Header />
      <div className="flex flex-1 bg-(--dash-surface-2)">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 bg-(--dash-surface)">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
