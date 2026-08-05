const form = document.querySelector("#check-form");
const input = document.querySelector("#url-input");
const button = document.querySelector("#check-button");
const resultEl = document.querySelector("#result");

const VERDICTS = {
  real: { emoji: "✅", title: "Looks real", className: "verdict-real" },
  suspicious: { emoji: "⚠️", title: "Reachable but suspicious", className: "verdict-suspicious" },
  unreachable: { emoji: "❌", title: "Unreachable", className: "verdict-unreachable" },
};

function cell(label, value) {
  return `
    <div class="cell">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>`;
}

function render(result) {
  const meta = VERDICTS[result.verdict] ?? VERDICTS.unreachable;
  const statusText = result.reachable
    ? `${result.status}${result.statusText ? " " + result.statusText : ""}`
    : "No response";

  resultEl.className = `result ${meta.className}`;
  resultEl.hidden = false;
  resultEl.innerHTML = `
    <div class="result-head">
      <div class="result-emoji">${meta.emoji}</div>
      <div>
        <p class="result-title">${meta.title}</p>
        <p class="result-sub">${result.finalUrl || result.url}</p>
      </div>
    </div>
    <div class="result-grid">
      ${cell("HTTP status", statusText)}
      ${cell("Response time", `${result.elapsedMs} ms`)}
      ${cell("Redirected", result.redirected ? "Yes" : "No")}
      ${cell("Checked at", new Date(result.checkedAt).toLocaleTimeString())}
    </div>
    ${result.error ? `<div class="error-note">${result.error}</div>` : ""}
  `;
}

function renderError(message) {
  resultEl.className = "result verdict-unreachable";
  resultEl.hidden = false;
  resultEl.innerHTML = `
    <div class="result-head">
      <div class="result-emoji">❌</div>
      <div>
        <p class="result-title">Could not check</p>
        <p class="result-sub">${message}</p>
      </div>
    </div>`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = input.value.trim();
  if (!url) return;

  button.disabled = true;
  button.textContent = "Checking…";

  try {
    const response = await fetch(`/api/check?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (!response.ok) {
      renderError(data.error || "Request failed.");
    } else {
      render(data);
    }
  } catch (error) {
    renderError(String(error?.message || error));
  } finally {
    button.disabled = false;
    button.textContent = "Check";
  }
});
