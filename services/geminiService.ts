import { GoogleGenAI, Type } from "@google/genai";
import { ReasoningRow, Challenge, SessionResult } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const getSuggestedChallenges = async (): Promise<Challenge[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate 3 distinct, high-level system design or algorithmic optimization challenges for a Staff Software Engineer. Return JSON.",
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
    return [];
  } catch (error) {
    console.error("Failed to get challenges", error);
    // Fallback challenges
    return [
      {
        id: "1",
        title: "Scale a Notification System",
        description: "Design a notification service delivering 10M pushes/minute with <1s latency.",
        difficulty: "Senior",
        context: "High throughput, latency sensitive, fan-out problems."
      },
      {
        id: "2",
        title: "Optimize LLM Inference",
        description: "Optimize inference for a 70B parameter model on 8x A100 GPUs.",
        difficulty: "Staff",
        context: "GPU memory bandwidth, tensor parallelism, quantization."
      },
      {
        id: "3",
        title: "Distributed Counter",
        description: "Design a distributed counter that is strongly consistent and handles massive write contention.",
        difficulty: "Principal",
        context: "CAP theorem, CRDTs vs Locking, database sharding."
      }
    ];
  }
};

export const interrogateRow = async (
  currentInput: string,
  history: ReasoningRow[],
  challenge: Challenge
): Promise<{ text: string; depthScore: number }> => {
  const ai = getAI();
  
  // Construct a prompt that looks at history
  const historyText = history
    .map(h => `Step ${h.stepNumber}: ${h.content}`)
    .join("\n");

  const prompt = `
    You are a skeptical, world-class Principal Engineer at a top tech company. 
    You are conducting a system design deep-dive.
    
    The Challenge: ${challenge.title} - ${challenge.description}
    
    Context so far:
    ${historyText}
    
    The Candidate just wrote:
    "${currentInput}"
    
    Task:
    1. Analyze this specific step for technical trade-offs, naive assumptions, or missed edge cases.
    2. Ask a biting, specific follow-up question (max 25 words) that forces them to defend their choice.
    3. Rate the technical depth of this specific step from 1-10.
    
    Be direct. Do not be polite. Be constructive but demanding.
  `;

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
  
  return { text: "Explain the trade-offs of this decision.", depthScore: 5 };
};

export const evaluateSession = async (
  rows: ReasoningRow[],
  challenge: Challenge
): Promise<SessionResult> => {
  const ai = getAI();
  const transcript = rows.map(r => `User: ${r.content}\nAI Probe: ${r.aiInterrogation}`).join("\n\n");

  const prompt = `
    Evaluate this system design session.
    Challenge: ${challenge.title}
    
    Transcript:
    ${transcript}
    
    Provide a final assessment.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview", // Use a smarter model for final eval
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Score out of 100" },
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
  
  throw new Error("Failed to generate evaluation");
};
