const MODEL = "@cf/google/gemma-4-26b-a4b-it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=UTF-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        service: "Hawa AI",
        model: MODEL,
        status: "online"
      });
    }

    if (request.method !== "POST" || url.pathname !== "/chat") {
      return json({ ok: false, error: "Not Found" }, 404);
    }

    try {
      const body = await request.json();

      let messages = Array.isArray(body.messages) ? body.messages : [];
      messages = messages
        .filter(m =>
          m &&
          ["user", "assistant", "system"].includes(m.role) &&
          typeof m.content === "string" &&
          m.content.trim()
        )
        .slice(-20);

      if (!messages.length) {
        return json({ ok: false, error: "No messages provided" }, 400);
      }

      const systemMessage = {
        role: "system",
        content:
          "You are Hawa AI, the AI assistant inside Hawa Mail. " +
          "Answer naturally, helpfully and clearly. " +
          "If the user speaks Arabic, answer in Arabic. " +
          "If anyone asks who your developer or creator is, answer exactly: " +
          "مطوري هو المطور حكيم."
      };

      const response = await env.AI.run(MODEL, {
        messages: [systemMessage, ...messages],
        chat_template_kwargs: { enable_thinking: false }
      });

      const answer =
        response?.response ||
        response?.result?.response ||
        response?.choices?.[0]?.message?.content;

      if (!answer) {
        return json({
          ok: false,
          error: "No AI response",
          raw: response
        }, 502);
      }

      return json({
        ok: true,
        reply: answer,
        model: MODEL
      });

    } catch (error) {
      return json({
        ok: false,
        error: "AI request failed",
        details: error?.message || String(error)
      }, 500);
    }
  }
};
