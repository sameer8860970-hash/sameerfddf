import { GoogleGenAI, Type } from "@google/genai";
import { ReasoningRow, Challenge, SessionResult } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  // If no key is found, we can't do anything real.
  // We'll throw here, and the UI will catch it to show the Key Input if needed (though instructions say don't show input).
  if (!apiKey) {
    console.warn("API Key not found in process.env.API_KEY");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// Fallback challenges to show immediately if API is slow or fails
const FALLBACK_CHALLENGES: Challenge[] = [
  {
    id: "1",
    title: "Scale a Notification System",
    description: "Design a notification service delivering 10M pushes/minute with <1s latency.",
    difficulty: "Senior",
    context: "High throughput, latency sensitive, fan-out problems. Consider broker choices, worker pools, and deduplication."
  },
  {
    id: "2",
    title: "Optimize LLM Inference",
    description: "Optimize inference for a 70B parameter model on 8x A100 GPUs.",
    difficulty: "Staff",
    context: "GPU memory bandwidth, tensor parallelism, quantization (FP8 vs INT4), and KV cache management."
  },
  {
    id: "3",
    title: "Distributed Counter",
    description: "Design a distributed counter that is strongly consistent and handles massive write contention.",
    difficulty: "Principal",
    context: "CAP theorem limits, CRDTs vs Global Locking, database sharding strategies, and conflict resolution."
  }
];

// Helper to timeout a promise
const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`Operation timed out after ${ms}ms`);
      resolve(fallback);
    }, ms);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error("API Error:", err);
        resolve(fallback);
      });
  });
};

export const getSuggestedChallenges = async (): Promise<Challenge[]> => {
  try {
    const ai = getAI();
    
    // Aggressive timeout (1.5s) to ensure the app loads fast. 
    // If Gemini is slow, we just show fallbacks immediately.
    return await withTimeout(
      (async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Generate 3 distinct, high-level system design challenges (Senior to Principal level). Return JSON.",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  context: { type: Type.STRING },
                },
                required: ["id", "title", "description", "difficulty", "context"]
              }
            }
          }
        });
        if (response.text) {
          return JSON.parse(response.text) as Challenge[];
        }
        return FALLBACK_CHALLENGES;
      })(),
      1500, // 1.5s timeout
      FALLBACK_CHALLENGES
    );

  } catch (error) {
    console.error("Failed to get challenges", error);
    return FALLBACK_CHALLENGES;
  }
};

export const interrogateRow = async (
  currentInput: string,
  history: ReasoningRow[],
  challenge: Challenge
): Promise<{ text: string; depthScore: number }> => {
  const ai = getAI();
  
  // Only take the last 3 steps to minimize token count and latency
  const recentHistory = history.slice(-3);
  const historyText = recentHistory
    .map(h => `Step ${h.stepNumber}: ${h.content}`)
    .join("\n");

  const prompt = `
    Role: Skeptical Principal Engineer.
    Context: System Design: ${challenge.title}.
    Previous: ${historyText}
    Current: "${currentInput}"
    
    Task: One short, sharp question (max 15 words) challenging the trade-offs. Rate depth (1-10).
  `;

  const fallbackResponse = { 
    text: "Can you elaborate on the specific trade-offs of this choice?", 
    depthScore: 5 
  };

  return await withTimeout(
    (async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interrogation: { type: Type.STRING },
              depthScore: { type: Type.NUMBER }
            },
            required: ["interrogation", "depthScore"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        return {
          text: data.interrogation,
          depthScore: data.depthScore
        };
      }
      return fallbackResponse;
    })(),
    4000, // 4s timeout for interrogation
    fallbackResponse
  );
};

export const evaluateSession = async (
  rows: ReasoningRow[],
  challenge: Challenge
): Promise<SessionResult> => {
  const ai = getAI();
  // Limit total context to prevent extremely long processing times
  const transcript = rows.slice(-20).map(r => `User: ${r.content}\nAI: ${r.aiInterrogation}`).join("\n\n");

  const prompt = `
    Evaluate this session. Challenge: ${challenge.title}.
    Transcript: ${transcript}
    Return JSON.
  `;

  const fallbackResult: SessionResult = {
    score: 0,
    summary: "Could not generate report due to timeout or error.",
    strengths: ["N/A"],
    weaknesses: ["N/A"]
  };

  return await withTimeout(
    (async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as SessionResult;
      }
      return fallbackResult;
    })(),
    8000, // 8s timeout for final report
    fallbackResult
  );
};