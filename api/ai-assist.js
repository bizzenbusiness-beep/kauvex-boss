// Vercel serverless function — keeps the Anthropic API key server-side.
// Called from the frontend as POST /api/ai-assist
// Body: { text: string, action: 'polish' | 'translate' | 'summarize', language: 'en'|'ml'|'manglish'|'hi'|'ar' }

const LANGUAGE_NAMES = {
  en: "English",
  ml: "Malayalam (Malayalam script)",
  manglish: "Manglish (Malayalam language, written using English/Latin letters, like informal texting)",
  hi: "Hindi (Devanagari script)",
  ar: "Arabic (Arabic script)",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server." });
  }

  const { text, action, language } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "No text provided." });
  }

  const langLabel = LANGUAGE_NAMES[language] || "English";
  let prompt;
  if (action === "translate") {
    prompt = `Translate the following business note into ${langLabel}. Output ONLY the translation, nothing else, no preamble.\n\nText:\n${text}`;
  } else if (action === "summarize") {
    prompt = `Summarize the following business note in 2-3 short sentences, written in ${langLabel}. Output ONLY the summary, nothing else.\n\nNote:\n${text}`;
  } else {
    // default: polish
    prompt = `Rewrite the following business note so it is clear, professional, and well organized, keeping it concise. Write the result in ${langLabel}. Output ONLY the rewritten note, nothing else, no preamble.\n\nNote:\n${text}`;
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: `Anthropic API error: ${errText}` });
    }

    const data = await r.json();
    const output = (data.content && data.content[0] && data.content[0].text) || "";
    return res.status(200).json({ result: output.trim() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
