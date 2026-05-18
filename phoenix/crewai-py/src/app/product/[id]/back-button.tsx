"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
    >
      &larr; Back to chat
    </button>
  );
}
