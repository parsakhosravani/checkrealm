import { describe, it, expect, vi } from "vitest";
import { normalizeUrl, checkUrl } from "./checker.js";

describe("normalizeUrl", () => {
  it("adds https scheme when missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("preserves an existing scheme", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("throws on empty input", () => {
    expect(() => normalizeUrl("   ")).toThrow();
  });

  it("rejects unsupported protocols", () => {
    expect(() => normalizeUrl("ftp://example.com")).toThrow();
  });
});

describe("checkUrl", () => {
  it("reports ok for a 200 response", async () => {
    const fakeFetch = vi.fn(
      async () => new Response("hi", { status: 200, statusText: "OK" }),
    );
    const result = await checkUrl("example.com", fakeFetch as unknown as typeof fetch);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.url).toBe("https://example.com/");
    expect(fakeFetch).toHaveBeenCalledOnce();
  });

  it("reports not ok for a 500 response", async () => {
    const fakeFetch = vi.fn(
      async () => new Response("nope", { status: 500, statusText: "Internal Server Error" }),
    );
    const result = await checkUrl("example.com", fakeFetch as unknown as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });

  it("captures network errors", async () => {
    const fakeFetch = vi.fn(async () => {
      throw new Error("boom");
    });
    const result = await checkUrl("example.com", fakeFetch as unknown as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(result.error).toBe("boom");
  });
});
