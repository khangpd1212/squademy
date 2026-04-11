import { useEffect, useState } from "react";
import {
  addToGradeQueue,
  clearGradeQueue,
  getGradeQueue,
  getPendingGradeCount,
} from "./flashcards";
import { apiRequest } from "@/lib/api/browser-client";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    getPendingGradeCount().then(setPendingCount);
  }, []);

  const syncGrades = async () => {
    if (!isOnline || isSyncing) return;

    const queue = await getGradeQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      const gradeData = queue.map((item) => ({
        deckId: item.deckId,
        cardId: item.cardId,
        grade: item.grade,
        createdAt: item.createdAt,
      }));

      const response = await apiRequest("/srs-progress/batch", {
        method: "POST",
        body: JSON.stringify({ grades: gradeData }),
      });

      if (response.status === 200) {
        const ids = queue.map((item) => item.id!).filter(Boolean);
        await clearGradeQueue(ids);
        setPendingCount(0);
      }
    } catch (error) {
      console.error("Failed to sync grades:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncGrades,
  };
}

export async function recordGrade(
  deckId: string,
  cardId: string,
  grade: number,
): Promise<void> {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      await apiRequest("/srs-progress", {
        method: "POST",
        body: JSON.stringify({ deckId, cardId, grade }),
      });
    } catch {
      await addToGradeQueue(deckId, cardId, grade);
    }
  } else {
    await addToGradeQueue(deckId, cardId, grade);
  }
}
