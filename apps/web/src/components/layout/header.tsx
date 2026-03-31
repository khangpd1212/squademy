"use client";

import { Menu, Bell } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
            />
          }
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={profile?.avatarUrl ?? undefined}
              alt={displayName}
            />
            <AvatarFallback>{initials}</AvatarFallback>
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
            }}
          >
            {logoutMutation.isPending ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
