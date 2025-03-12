import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Securely load API key
  dangerouslyAllowBrowser: true, // Only if backend is not an option
});

export async function getAICompletion(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    return response.choices[0]?.message.content || "";
  } catch (error) {
    console.error("AI Completion Error:", error);
    return "";
  }
}
