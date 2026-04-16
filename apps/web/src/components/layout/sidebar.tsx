"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  Dumbbell,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Plus,
  Settings
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: { title: string; href: string; icon?: React.ComponentType<{ className?: string }>; iconSrc?: string }[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Flashcards", href: "/studio/flashcards", iconSrc: "/flash-cards.png" },
  { title: "Lesson Studio", href: "/studio/lessons", icon: BookOpen },
  { title: "Exercise Studio", href: "/studio/exercises", icon: Dumbbell },
  { title: "Create Group", href: "/groups/create", icon: Plus },
  { title: "Invitations", href: "/invitations", icon: Mail },
  { title: "Peer Review", href: "/review", icon: MessageSquare },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <BookOpen className="h-5 w-5" />
          <span>Squademy</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground"
              )}
            >
              {item.iconSrc ? (
                <Image
                  src={item.iconSrc}
                  alt={item.title}
                  className="h-4 w-4"
                  width={16}
                  height={16}
                />
              ) : Icon ? (
                <Icon className="h-4 w-4" />
              ) : null}
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
