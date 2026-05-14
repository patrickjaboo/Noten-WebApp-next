"use client";

const TAG_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
  "bg-yellow-100 text-yellow-800",
  "bg-red-100 text-red-800",
  "bg-indigo-100 text-indigo-800",
  "bg-cyan-100 text-cyan-800",
  "bg-lime-100 text-lime-800",
  "bg-rose-100 text-rose-800",
];

const tagColorCache: Record<string, string> = {};
let colorIndex = 0;

export function getTagColor(tag: string): string {
  if (!tagColorCache[tag]) {
    tagColorCache[tag] = TAG_COLORS[colorIndex % TAG_COLORS.length];
    colorIndex++;
  }
  return tagColorCache[tag];
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTagColor(tag)}`}
    >
      {tag}
    </span>
  );
}
