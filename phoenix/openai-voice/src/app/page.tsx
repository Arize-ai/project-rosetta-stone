import { Suspense } from "react";
import { Chat } from "@/components/Chat";

// Chat uses useSearchParams() to honor ?ask=... from the cart-checkout flow.
// Suspense lets Next.js prerender the route shell without bailing out.
export default function Home() {
  return (
    <Suspense fallback={null}>
      <Chat />
    </Suspense>
  );
}
