import { useState, type FormEvent } from "react";
import "./App.css";

interface CheckResult {
  url: string;
  finalUrl: string;
  ok: boolean;
  status: number | null;
  statusText: string;
  responseTimeMs: number;
  error?: string;
  checkedAt: string;
}

function StatusBadge({ result }: { result: CheckResult }) {
  const label = result.ok
    ? "Online"
    : result.status
      ? "Reachable"
      : "Offline";
  const tone = result.ok ? "ok" : result.status ? "warn" : "down";
  return <span className={`badge badge--${tone}`}>{label}</span>;
}

export default function App() {
  const [input, setInput] = useState("example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckResult[]>([]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const url = input.trim();
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as CheckResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setHistory((prev) => [data, ...prev].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const latest = history[0];

  return (
    <div className="app">
      <header className="hero">
        <div className="logo" aria-hidden="true">✓</div>
        <h1>checkrealm</h1>
        <p className="tagline">Instantly check whether a domain or URL realm is up and responding.</p>
      </header>

      <form className="checker" onSubmit={handleSubmit}>
        <input
          className="checker__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="example.com or https://example.com/path"
          aria-label="URL to check"
          autoComplete="off"
          spellCheck={false}
        />
        <button className="checker__button" type="submit" disabled={loading}>
          {loading ? "Checking…" : "Check realm"}
        </button>
      </form>

      {error && <div className="alert" role="alert">{error}</div>}

      {latest && (
        <section className="result" aria-live="polite">
          <div className="result__head">
            <StatusBadge result={latest} />
            <code className="result__url">{latest.finalUrl}</code>
          </div>
          <div className="result__grid">
            <div>
              <span className="result__label">HTTP status</span>
              <span className="result__value">
                {latest.status ? `${latest.status} ${latest.statusText}`.trim() : "—"}
              </span>
            </div>
            <div>
              <span className="result__label">Response time</span>
              <span className="result__value">{latest.responseTimeMs} ms</span>
            </div>
            <div>
              <span className="result__label">Checked at</span>
              <span className="result__value">
                {new Date(latest.checkedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
          {latest.error && <div className="result__error">Error: {latest.error}</div>}
        </section>
      )}

      {history.length > 1 && (
        <section className="history">
          <h2>Recent checks</h2>
          <ul>
            {history.slice(1).map((item, index) => (
              <li key={`${item.checkedAt}-${index}`} className="history__row">
                <StatusBadge result={item} />
                <span className="history__url">{item.finalUrl}</span>
                <span className="history__meta">
                  {item.status ?? "—"} · {item.responseTimeMs} ms
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="footer">
        checkrealm · a tiny full-stack uptime checker
      </footer>
    </div>
  );
}
