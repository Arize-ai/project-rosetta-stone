import { Suspense } from "react";
import { Chat } from "@/components/Chat";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Chat />
    </Suspense>
  );
}
