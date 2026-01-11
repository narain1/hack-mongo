import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses text and highlights text starting with "@" in primary color (orange)
 * Returns an array of React elements
 */
export function parseMentions(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const mentionRegex = /(@[^\s]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the mention with primary color styling
    parts.push(
      <span key={match.index} className="text-primary font-medium">
        {match[0]}
      </span>
    );
    
    lastIndex = mentionRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

