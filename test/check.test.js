import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeUrl, checkUrl } from "../src/check.js";

test("normalizeUrl adds https to bare domains", () => {
  assert.equal(normalizeUrl("example.com"), "https://example.com/");
});

test("normalizeUrl keeps an explicit http protocol", () => {
  assert.equal(normalizeUrl("http://example.com/path"), "http://example.com/path");
});

test("normalizeUrl rejects empty input", () => {
  assert.throws(() => normalizeUrl("   "), /required/i);
});

test("normalizeUrl rejects non-http protocols", () => {
  assert.throws(() => normalizeUrl("ftp://example.com"), /http and https/i);
});

test("normalizeUrl rejects hostnames without a dot", () => {
  assert.throws(() => normalizeUrl("localhostish"), /real domain/i);
});

test("checkUrl returns a 'real' verdict for a 200 response", async () => {
  const fetchImpl = async (url) => ({
    status: 200,
    statusText: "OK",
    redirected: false,
    url,
  });

  const result = await checkUrl("example.com", { fetchImpl });
  assert.equal(result.verdict, "real");
  assert.equal(result.reachable, true);
  assert.equal(result.status, 200);
  assert.equal(result.url, "https://example.com/");
});

test("checkUrl returns 'suspicious' for a 4xx/5xx response", async () => {
  const fetchImpl = async (url) => ({
    status: 404,
    statusText: "Not Found",
    redirected: true,
    url: url + "missing",
  });

  const result = await checkUrl("example.com/missing", { fetchImpl });
  assert.equal(result.verdict, "suspicious");
  assert.equal(result.redirected, true);
});

test("checkUrl returns 'unreachable' when fetch throws", async () => {
  const fetchImpl = async () => {
    throw new Error("getaddrinfo ENOTFOUND");
  };

  const result = await checkUrl("no-such-domain.example", { fetchImpl });
  assert.equal(result.verdict, "unreachable");
  assert.equal(result.reachable, false);
  assert.match(result.error, /ENOTFOUND/);
});

test("checkUrl reports a timeout", async () => {
  const fetchImpl = async (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    });

  const result = await checkUrl("slow.example", { fetchImpl, timeoutMs: 20 });
  assert.equal(result.verdict, "unreachable");
  assert.match(result.error, /Timed out/);
});
