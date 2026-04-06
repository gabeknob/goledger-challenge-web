declare global {
  interface Window {
    __ENV__?: Record<string, string | undefined>;
  }
}

export function getEnv(key: string): string {
  const runtime = typeof window !== "undefined" ? window.__ENV__?.[key] : undefined;
  return runtime ?? (import.meta.env[key] as string | undefined) ?? "";
}
