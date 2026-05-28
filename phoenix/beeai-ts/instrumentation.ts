// Next.js auto-detects this file and runs `register()` once per server
// process at startup, before user-land modules load. We delegate to the
// shared tracing initialiser in `src/beeai/tracing.ts` so the smoke script
// can use the same wiring.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { initTracing } = await import("./src/beeai/tracing");
  await initTracing();
}
