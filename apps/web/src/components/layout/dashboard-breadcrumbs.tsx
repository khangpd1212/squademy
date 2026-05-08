"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  studio: "Studio",
  lessons: "Lessons",
  exercises: "Exercises",
  flashcards: "Flashcards",
  groups: "Groups",
  create: "Create Group",
  invitations: "Invitations",
  review: "Peer Review",
  settings: "Settings",
  group: "Group",
  roadmap: "Roadmap",
  leaderboard: "Leaderboard",
  exercise: "Exercise",
};

function isIdSegment(seg: string): boolean {
  return /^[0-9a-f]{8,}$/i.test(seg) || /^\d+$/.test(seg) || seg.length > 20;
}

function labelForSegment(seg: string): string {
  if (isIdSegment(seg)) return "";
  return LABEL_MAP[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [];
  let accumulated = "";

  for (const seg of segments) {
    accumulated += "/" + seg;
    const label = labelForSegment(seg);
    if (label) {
      crumbs.push({ label, href: accumulated });
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="ml-2 hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground" />
            }
          >
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
