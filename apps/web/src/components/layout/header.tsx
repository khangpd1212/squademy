"use client";

import { BookOpen, Bell, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLogout } from "@/hooks/api/use-auth-queries";
import { useProfile } from "@/hooks/api/use-user-queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores";
import Link from "next/link";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";

export function Header() {
  const router = useRouter();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const logoutMutation = useLogout();
  const { data: profile } = useProfile();

  const displayName = profile?.displayName ?? "User";
  const initials = displayName.charAt(0).toUpperCase();

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#050505] px-4 md:px-6">
      {/* Left: mobile menu + brand */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-linear-to-br from-(--dash-primary) to-(--dash-primary-active) shadow-sm">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:block font-bold text-white">Squademy</span>
        </Link>

        <DashboardBreadcrumbs />
      </div>

      {/* Right: search + notifications + avatar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden sm:relative sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search resources..."
            className="w-48 rounded-md border border-white/10 bg-[#0a0a0a] py-1.5 pl-9 pr-8 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-(--dash-primary) focus:ring-1 focus:ring-(--dash-primary)"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">
            ⌘K
          </kbd>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-white hover:bg-white/5">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--dash-primary) ring-2 ring-[#050505]" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full p-0"
              />
            }>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={profile?.avatarUrl ?? undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-linear-to-tr from-(--dash-primary) to-(--dash-primary-hover) text-sm font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href="/settings" />}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              nativeButton
              render={<button type="button" className="w-full text-left" />}
              onClick={() => {
                if (!logoutMutation.isPending) {
                  void handleLogout();
                }
              }}>
              {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
