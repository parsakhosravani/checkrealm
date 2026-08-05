export interface CheckResult {
  url: string;
  finalUrl: string;
  ok: boolean;
  status: number | null;
  statusText: string;
  responseTimeMs: number;
  error?: string;
  checkedAt: string;
}

/**
 * Normalizes user input into an absolute http(s) URL. Bare hostnames such as
 * "example.com" are upgraded to https. Throws when the value cannot form a URL.
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }
  const schemeMatch = /^([a-z][a-z0-9+.-]*):\/\//i.exec(trimmed);
  if (schemeMatch && !/^https?$/i.test(schemeMatch[1])) {
    throw new Error("Only http and https URLs are supported");
  }
  const withScheme = schemeMatch ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withScheme);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }
  return parsed.toString();
}

type FetchFn = typeof fetch;

/**
 * Performs a single reachability check against the given URL. A custom fetch
 * implementation can be injected for testing.
 */
export async function checkUrl(
  input: string,
  fetchImpl: FetchFn = fetch,
  timeoutMs = 10_000,
): Promise<CheckResult> {
  const url = normalizeUrl(input);
  const checkedAt = new Date().toISOString();
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "checkrealm/0.1 (+https://github.com/parsakhosravani/checkrealm)" },
    });
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      url,
      finalUrl: res.url || url,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      responseTimeMs,
      checkedAt,
    };
  } catch (err) {
    const responseTimeMs = Math.round(performance.now() - start);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      url,
      finalUrl: url,
      ok: false,
      status: null,
      statusText: "",
      responseTimeMs,
      error: isAbort ? "Request timed out" : err instanceof Error ? err.message : "Unknown error",
      checkedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}
