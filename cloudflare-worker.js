export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url");

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (!target) {
      return new Response("Missing ?url=", { status: 400, headers: cors });
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return new Response("Invalid URL", { status: 400, headers: cors });
    }

    if (parsed.hostname !== "botrix.live") {
      return new Response("Only botrix.live is allowed", { status: 403, headers: cors });
    }

    const upstream = await fetch(parsed.toString(), {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "BotRix-Widget-Proxy/1.0"
      }
    });

    const body = await upstream.arrayBuffer();
    const headers = new Headers(cors);
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "text/plain; charset=utf-8");
    headers.set("Cache-Control", "no-store");

    return new Response(body, {
      status: upstream.status,
      headers
    });
  }
};
