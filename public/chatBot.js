/*!
 * Support.ai embeddable chat widget
 * Usage: <script src="https://YOUR_APP/chatBot.js" data-bot-id="..."></script>
 * Optional: data-title="Help", data-color="#0f766e"
 *
 * Renders inside a Shadow DOM (no CSS/ID collisions with the host page) and
 * uses textContent only (model output is never interpreted as HTML).
 */
(function () {
  "use strict";

  const script = document.currentScript;
  if (!script) return;
  const botId = script.getAttribute("data-bot-id");
  if (!botId) return console.warn("[support-ai] missing data-bot-id attribute");
  if (document.getElementById("support-ai-widget-host")) return;

  const apiUrl = new URL(script.src, location.href).origin + "/api/chat";
  const title = script.getAttribute("data-title") || "Customer Support";
  const colorAttr = script.getAttribute("data-color") || "";
  const color = /^#[0-9a-fA-F]{6}$/.test(colorAttr) ? colorAttr : "#111111";
  const MAX_HISTORY = 6;

  // Anonymous, per-browser session id (falls back to in-memory if storage is blocked).
  function randomId() {
    const b = new Uint8Array(12);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  }
  let sessionId;
  try {
    sessionId = localStorage.getItem("support-ai:sid") || randomId();
    localStorage.setItem("support-ai:sid", sessionId);
  } catch {
    sessionId = randomId();
  }

  const host = document.createElement("div");
  host.id = "support-ai-widget-host";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; }
      .fab { position: fixed; right: 24px; bottom: 24px; width: 56px; height: 56px; border-radius: 50%;
        border: 0; background: ${color}; color: #fff; font-size: 22px; cursor: pointer; z-index: 2147483646;
        box-shadow: 0 12px 32px rgba(0,0,0,.3); }
      .box { position: fixed; right: 24px; bottom: 92px; width: min(360px, calc(100vw - 32px));
        height: min(480px, calc(100vh - 120px)); background: #fff; border-radius: 14px; overflow: hidden;
        display: none; flex-direction: column; z-index: 2147483646; box-shadow: 0 24px 60px rgba(0,0,0,.25); }
      .box.open { display: flex; }
      header { background: ${color}; color: #fff; padding: 12px 14px; font-size: 14px; display: flex;
        justify-content: space-between; align-items: center; }
      header button { background: none; border: 0; color: #fff; font-size: 18px; cursor: pointer; }
      .log { flex: 1; padding: 12px; overflow-y: auto; background: #f9fafb; display: flex; flex-direction: column; gap: 8px; }
      .msg { max-width: 82%; padding: 8px 12px; border-radius: 14px; font-size: 13px; line-height: 1.45;
        white-space: pre-wrap; overflow-wrap: anywhere; }
      .user { align-self: flex-end; background: ${color}; color: #fff; border-top-right-radius: 4px; }
      .bot { align-self: flex-start; background: #e5e7eb; color: #111; border-top-left-radius: 4px; }
      .err { align-self: flex-start; background: #fee2e2; color: #991b1b; }
      .typing { align-self: flex-start; font-size: 12px; color: #6b7280; }
      form { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #e5e7eb; }
      input { flex: 1; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; outline: none; }
      input:focus { border-color: ${color}; }
      form button { padding: 8px 12px; border: 0; border-radius: 8px; background: ${color}; color: #fff;
        font-size: 13px; cursor: pointer; }
      form button:disabled { opacity: .5; cursor: not-allowed; }
    </style>
    <button class="fab" aria-label="Open chat" aria-expanded="false">🗨️</button>
    <section class="box" role="dialog" aria-label="Chat support">
      <header><span class="title"></span><button class="close" aria-label="Close chat">✕</button></header>
      <div class="log" role="log" aria-live="polite"></div>
      <form>
        <input type="text" maxlength="500" placeholder="Type a message" aria-label="Message" autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const fab = $(".fab"), box = $(".box"), log = $(".log"), form = $("form");
  const input = $("input"), sendBtn = $("form button");
  $(".title").textContent = title;

  const history = [];
  let pending = false;

  function add(text, kind) {
    const el = document.createElement("div");
    el.className = "msg " + kind;
    el.textContent = text; // never innerHTML
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function toggle(open) {
    box.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  }
  fab.addEventListener("click", () => toggle(!box.classList.contains("open")));
  $(".close").addEventListener("click", () => toggle(false));
  root.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });

  add("Hi! 👋 How can I help you today?", "bot");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Enter key submits the form
    const text = input.value.trim();
    if (!text || pending) return;

    add(text, "user");
    input.value = "";
    pending = true;
    sendBtn.disabled = true;
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.textContent = "Typing…";
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, sessionId, message: text, history: history.slice(-MAX_HISTORY) }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (!res.ok) {
        add(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.", "err");
      } else {
        add(data.reply, "bot");
        history.push({ role: "user", content: text }, { role: "assistant", content: String(data.reply).slice(0, 1500) });
      }
    } catch {
      typing.remove();
      add("Can't reach the support service. Check your connection and try again.", "err");
    } finally {
      pending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  document.body.appendChild(host);
})();
