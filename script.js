(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const countEl = document.getElementById("count");
  const labelEl = document.getElementById("label");
  const statusEl = document.getElementById("status");

  const config = {
    bid: params.get("bid") || "",
    platform: params.get("platform") || "kick",
    type: params.get("type") || "cantidadSubs",
    label: params.get("label") || "TOTAL SUBS",
    font: params.get("font") || "Pixelify Sans",
    labelColor: params.get("labelColor") || "#ffffff",
    countColor: params.get("countColor") || "#ffffff",
    glowColor: params.get("glowColor") || "#b56cff",
    labelSize: clampInt(params.get("labelSize"), 10, 120, 30),
    countSize: clampInt(params.get("countSize"), 12, 220, 58),
    gap: clampInt(params.get("gap"), 0, 80, 4),
    glow: clampFloat(params.get("glow"), 0, 3, 1),
    weight: clampInt(params.get("weight"), 100, 900, 700),
    align: params.get("align") || "center",
    animation: params.get("animation") || "none",
    poll: clampInt(params.get("poll"), 3000, 60000, 10000),
    fallback: parseNumber(params.get("fallback")),
    debug: params.get("debug") === "1",
    proxy: params.get("proxy") || "",
  };

  const endpoints = [
    "https://botrix.live/widgets/labels/labels",
    "https://botrix.live/widgets/labels"
  ];

  let currentValue = null;
  let timer = null;

  function clampInt(v, min, max, fallback) {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }

  function clampFloat(v, min, max, fallback) {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }

  function parseNumber(v) {
    if (v == null || v === "") return null;
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  function applyTheme() {
    labelEl.textContent = config.label;
    document.documentElement.style.setProperty("--label-color", config.labelColor);
    document.documentElement.style.setProperty("--count-color", config.countColor);
    document.documentElement.style.setProperty("--glow-color", config.glowColor);
    document.documentElement.style.setProperty("--label-size", `${config.labelSize}px`);
    document.documentElement.style.setProperty("--count-size", `${config.countSize}px`);
    document.documentElement.style.setProperty("--gap", `${config.gap}px`);
    document.documentElement.style.setProperty("--font-weight", String(config.weight));
    document.documentElement.style.setProperty("--glow-strength", String(config.glow));

    const fontMap = {
      "Pixelify Sans": '"Pixelify Sans", sans-serif',
      "Orbitron": '"Orbitron", sans-serif',
      "Roboto": '"Roboto", sans-serif',
      "Arial": 'Arial, sans-serif'
    };
    document.documentElement.style.setProperty("--font-family", fontMap[config.font] || fontMap["Pixelify Sans"]);

    const alignMap = {
      left: ["flex-start", "left"],
      center: ["center", "center"],
      right: ["flex-end", "right"]
    };
    const [items, text] = alignMap[config.align] || alignMap.center;
    document.documentElement.style.setProperty("--align-items", items);
    document.documentElement.style.setProperty("--text-align", text);

    document.body.classList.toggle("debug", config.debug);
    document.body.classList.remove("anim-pulse", "anim-float", "anim-flicker");
    if (["pulse", "float", "flicker"].includes(config.animation)) {
      document.body.classList.add(`anim-${config.animation}`);
    }
  }

  function setStatus(text) {
    statusEl.textContent = text;
    console.log("[BotRix V3]", text);
  }

  function render(value) {
    if (!Number.isFinite(value)) return;
    if (currentValue !== value) {
      countEl.classList.remove("bump");
      void countEl.offsetWidth;
      countEl.classList.add("bump");
      setTimeout(() => countEl.classList.remove("bump"), 220);
    }
    currentValue = value;
    countEl.textContent = value.toLocaleString("en-US");
  }

  function extractNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === "string") {
      const match = value.replace(/,/g, "").match(/-?\d+/);
      return match ? Number.parseInt(match[0], 10) : null;
    }
    if (value && typeof value === "object") {
      const priority = ["value", "count", "subs", "subscribers", "cantidadSubs", "data", "result", "label"];
      for (const key of priority) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const found = extractNumber(value[key]);
          if (found !== null) return found;
        }
      }
      for (const nested of Object.values(value)) {
        const found = extractNumber(nested);
        if (found !== null) return found;
      }
    }
    return null;
  }

  function buildTarget(base) {
    const url = new URL(base);
    url.searchParams.set("bid", config.bid);
    url.searchParams.set("type", config.type);
    url.searchParams.set("platform", config.platform);
    url.searchParams.set("interval", "0");
    url.searchParams.set("_", Date.now().toString());
    return url.toString();
  }

  function throughProxy(target) {
    if (!config.proxy) return target;
    const proxyUrl = new URL(config.proxy);
    proxyUrl.searchParams.set("url", target);
    return proxyUrl.toString();
  }

  async function request(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "omit",
        headers: { "Accept": "application/json, text/plain, */*" },
        signal: controller.signal
      });
      const raw = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let payload = raw;
      try { payload = JSON.parse(raw); } catch (_) {}
      return { payload, raw };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function refresh() {
    if (!config.bid) {
      setStatus("Missing BotRix bid. Open setup.html to generate a widget URL.");
      if (config.fallback !== null) render(config.fallback);
      return;
    }

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const target = buildTarget(endpoint);
        const { payload, raw } = await request(throughProxy(target));
        const value = extractNumber(payload);
        if (value === null) throw new Error(`No subscriber number found: ${raw.slice(0, 100)}`);
        render(value);
        setStatus(`Connected — ${value}`);
        schedule();
        return;
      } catch (error) {
        lastError = error;
        console.warn("[BotRix V3]", endpoint, error);
      }
    }

    if (currentValue === null && config.fallback !== null) render(config.fallback);
    setStatus(`Direct BotRix request failed: ${lastError?.message || "unknown error"}. A proxy may be required.`);
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(refresh, config.poll);
  }

  window.refreshBotRixSubs = refresh;
  window.setTotalSubs = value => render(Number(value));

  applyTheme();
  refresh();
})();
