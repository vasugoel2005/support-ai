import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import type { GeminiContent } from "./prompt";

const answerSchema = z.object({ answer: z.string(), answered: z.boolean() });
export type AiAnswer = z.infer<typeof answerSchema>;

const TIMEOUT_MS = 15_000;
const FALLBACK = "Sorry, I couldn't process that. Please try rephrasing your question.";

export async function generateAnswer(args: {
  systemInstruction: string;
  contents: GeminiContent[];
}): Promise<AiAnswer> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const call = ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: args.contents,
    config: {
      systemInstruction: args.systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 600,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { answer: { type: Type.STRING }, answered: { type: Type.BOOLEAN } },
        required: ["answer", "answered"],
      },
    },
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS);
  });
  try {
    const res = await Promise.race([call, timeout]);
    const parsed = answerSchema.safeParse(JSON.parse(res.text ?? "{}"));
    return parsed.success ? parsed.data : { answer: FALLBACK, answered: false };
  } catch (err) {
    if (err instanceof SyntaxError) return { answer: FALLBACK, answered: false };
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
