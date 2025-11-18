// /pages/api/chatbot.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message, context } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY missing." });
  }

  try {
    const userText = `${context ? `Product context: ${JSON.stringify(context)}\n` : ""}${message}`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userText }]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data, null, 2));

    let reply = "Sorry, no response.";

    if (data?.candidates?.length) {
      reply = data.candidates
        .map(c => 
          c.content?.parts
            ?.map(p => p.text || "")
            .filter(Boolean)
            .join("\n")
        )
        .filter(Boolean)
        .join("\n");
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Failed to fetch from Gemini." });
  }
}
