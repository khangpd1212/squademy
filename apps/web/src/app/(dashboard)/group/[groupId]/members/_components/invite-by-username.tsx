"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchResult = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type InviteByUsernameProps = {
  groupId: string;
};

export function InviteByUsername({ groupId }: InviteByUsernameProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/profiles/search?q=${encodeURIComponent(query.trim())}&groupId=${groupId}`
        );
        if (response.ok) {
          const data = (await response.json()) as { profiles: SearchResult[] };
          setResults(data.profiles);
        }
      } catch {
        setError("Search failed.");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, groupId]);

  async function handleSendInvite(inviteeId: string) {
    setSendingId(inviteeId);
    setError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, inviteeId }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok) {
        setError(payload.message ?? "Could not send invitation.");
        return;
      }

      setSentIds((prev) => new Set(prev).add(inviteeId));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="invite-search">Invite by username</Label>
      <Input
        id="invite-search"
        placeholder="Search by display name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isSearching ? (
        <p className="text-xs text-muted-foreground">Searching...</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {results.length > 0 ? (
        <ul className="rounded border divide-y">
          {results.map((profile) => (
            <li
              key={profile.id}
              className="flex items-center justify-between px-3 py-2"
            >
              <span className="text-sm">
                {profile.display_name ?? "Unknown"}
              </span>
              {sentIds.has(profile.id) ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Invite sent!
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sendingId === profile.id}
                  onClick={() => handleSendInvite(profile.id)}
                >
                  {sendingId === profile.id ? "Sending..." : "Send Invite"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {query.trim().length >= 2 &&
      !isSearching &&
      results.length === 0 ? (
        <p className="text-xs text-muted-foreground">No users found.</p>
      ) : null}
    </div>
  );
}
