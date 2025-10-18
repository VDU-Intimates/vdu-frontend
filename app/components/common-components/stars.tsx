"use client";
import { Star } from "lucide-react";

export default function Stars({
  value = 0,
  count,
  size = 16,
}: { value?: number; count?: number; size?: number }) {
  const full = Math.round(value || 0);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`${full} star rating`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`shrink-0 ${i < full ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
            style={{ width: size, height: size }}
          />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-gray-600">({count})</span>
      )}
    </div>
  );
}
