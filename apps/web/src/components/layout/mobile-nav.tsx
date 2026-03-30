"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Dumbbell,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Lessons", href: "/studio/lessons", icon: BookOpen },
  { title: "Exercises", href: "/studio/exercises", icon: Dumbbell },
  { title: "Group", href: "/groups/create", icon: Plus },
  { title: "Invites", href: "/invitations", icon: Mail },
  { title: "Review", href: "/review", icon: MessageSquare },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 text-xs",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
