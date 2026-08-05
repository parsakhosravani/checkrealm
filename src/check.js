const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Normalize raw user input into an absolute http(s) URL.
 * Bare hostnames like "example.com" are assumed to be https.
 * Throws when the input cannot be turned into a valid http(s) URL.
 */
export function normalizeUrl(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("A URL is required.");
  }

  const trimmed = input.trim();
  const explicitScheme = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (explicitScheme && !/^https?$/i.test(explicitScheme[1])) {
    throw new Error("Only http and https URLs are supported.");
  }

  const withProtocol = explicitScheme ? trimmed : `https://${trimmed}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`"${input}" is not a valid URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported.");
  }

  if (!parsed.hostname.includes(".")) {
    throw new Error(`"${input}" does not look like a real domain.`);
  }

  return parsed.toString();
}

function verdictFor({ reachable, status }) {
  if (!reachable) return "unreachable";
  if (status >= 200 && status < 400) return "real";
  return "suspicious";
}

/**
 * Check whether a website is real and reachable.
 *
 * @param {string} input raw user-supplied URL or hostname
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl] injectable fetch (for testing)
 * @param {number} [options.timeoutMs]
 * @returns {Promise<object>} structured check result
 */
export async function checkUrl(input, options = {}) {
  const { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const url = normalizeUrl(input);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "CheckRealm/0.1 (+https://github.com/parsakhosravani/checkrealm)" },
    });

    const elapsedMs = Date.now() - startedAt;
    const reachable = true;
    const status = response.status;

    return {
      input,
      url,
      reachable,
      status,
      statusText: response.statusText || "",
      redirected: Boolean(response.redirected),
      finalUrl: response.url || url,
      elapsedMs,
      verdict: verdictFor({ reachable, status }),
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const aborted = error?.name === "AbortError";

    return {
      input,
      url,
      reachable: false,
      status: 0,
      statusText: "",
      redirected: false,
      finalUrl: url,
      elapsedMs,
      verdict: "unreachable",
      error: aborted ? `Timed out after ${timeoutMs} ms.` : String(error?.message || error),
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}
