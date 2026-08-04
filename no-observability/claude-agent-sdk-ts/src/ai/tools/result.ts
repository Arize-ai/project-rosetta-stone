// Wrap a JSON-serialisable payload in the MCP tool-result envelope the Claude
// Agent SDK expects from an in-process tool handler. Mirrors the Python tier's
// `_text()` helper in backend/tools.py. The `type: "text"` literal keeps the
// shape assignable to the SDK's `CallToolResult` without importing the type
// from the transitive `@modelcontextprotocol/sdk` package.
export function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
}
