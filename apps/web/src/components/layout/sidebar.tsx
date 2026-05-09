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
    <aside className="hidden w-64 shrink-0 border-r border-(--dash-border-subtle) bg-(--dash-surface) md:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-(--dash-glass-active) text-(--dash-text) font-medium"
                    : "text-(--dash-text-subtle) hover:text-(--dash-text) hover:bg-(--dash-glass-hover)",
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
