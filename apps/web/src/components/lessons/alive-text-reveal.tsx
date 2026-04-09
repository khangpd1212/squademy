"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api/browser-client";

interface AliveTextRevealProps {
  blockId: string;
  lessonId: string;
  children: React.ReactNode;
}

export function AliveTextReveal({
  blockId,
  lessonId,
  children,
}: AliveTextRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = async () => {
    if (isRevealed) return;

    try {
      await apiRequest(`/lessons/${lessonId}/interactions`, {
        method: "POST",
        body: JSON.stringify({ blockId, interactionType: "reveal" }),
      });
    } catch {
      // Ignore API errors, still reveal content
    }

    setIsRevealed(true);
  };

  if (!isRevealed) {
    return (
      <motion.span
        className="inline-flex gap-1 mx-0.5 align-middle cursor-pointer"
        onClick={handleReveal}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        role="button"
        aria-label="Click to reveal"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-purple-500"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.span>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-purple-700 dark:text-purple-400 font-medium"
    >
      {children}
    </motion.span>
  );
}