// app/actions/agent/providers.ts
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const parseKeys = (envVar: string | undefined): string[] => {
  if (!envVar) return [];
  return envVar.split(',').map(k => k.replace(/\\n/g, '').replace(/\n/g, '').trim()).filter(k => k.length > 0);
};

export const GROQ_KEYS = parseKeys(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY);
export const GEMINI_KEYS = parseKeys(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY);
export const SERPER_KEYS = parseKeys(process.env.SERPER_KEYS || process.env.SERPER_API_KEY);
export const TAVILY_KEYS = parseKeys(process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY);

const getRandomKey = (keys: string[]) => {
  if (keys.length === 0) return null;
  return keys[Math.floor(Math.random() * keys.length)];
};

export const getGroqModel = (isVision: boolean = false) => {
  const key = getRandomKey(GROQ_KEYS);
  if (!key) throw new Error("No GROQ keys found");
  
  return new ChatGroq({
    apiKey: key,
    model: isVision ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile', // 🚀 FIXED FOR 2026 ENVIRONMENT
    temperature: 0.0,
    maxRetries: 3,
  });
};

export const getGeminiModel = () => {
  const key = getRandomKey(GEMINI_KEYS);
  if (!key) throw new Error("No GEMINI keys found");
  
  return new ChatGoogleGenerativeAI({
    apiKey: key,
    model: 'gemini-2.5-flash', // 🚀 FIXED: modelName -> model
    temperature: 0.0,
    maxRetries: 3,
  });
};

export const getSerperKey = () => getRandomKey(SERPER_KEYS);

export const getTavilyKey = () => getRandomKey(TAVILY_KEYS);