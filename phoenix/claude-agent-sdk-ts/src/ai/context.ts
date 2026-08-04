import { AsyncLocalStorage } from "node:async_hooks";

// Per-request user id, made ambient so the Wonder Toys tools can read it
// without the model having to pass it. This is the TypeScript equivalent of
// the Python tier's `current_user_id` contextvar (backend/context.py): the
// chat route calls `runWithUserId(userId, ...)` before driving the agent, and
// the in-process MCP tools read it back via `getUserId()`. AsyncLocalStorage
// propagates across awaits into the tool callbacks the SDK invokes while the
// query iterator is being consumed.
const userIdStore = new AsyncLocalStorage<string>();

export function runWithUserId<T>(userId: string, fn: () => T): T {
  return userIdStore.run(userId, fn);
}

export function enterUserId(userId: string): void {
  userIdStore.enterWith(userId);
}

export function getUserId(): string {
  return userIdStore.getStore() ?? "anonymous";
}
