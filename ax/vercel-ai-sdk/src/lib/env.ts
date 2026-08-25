const REQUIRED_RUNTIME_ENV = [
  "ANTHROPIC_API_KEY",
  "ARIZE_SPACE_ID",
  "ARIZE_API_KEY",
  "ARIZE_PROJECT_NAME",
] as const;

const REQUIRED_AX_ENV = [
  "ARIZE_SPACE_ID",
  "ARIZE_API_KEY",
  "ARIZE_PROJECT_NAME",
] as const;

function missingEnv(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]?.trim());
}

export function missingRuntimeEnv(): string[] {
  return missingEnv(REQUIRED_RUNTIME_ENV);
}

export function missingAxEnv(): string[] {
  return missingEnv(REQUIRED_AX_ENV);
}
