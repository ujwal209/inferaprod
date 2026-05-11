import { ChatGroq } from "@langchain/groq";

const parseKeys = (envVar: string | undefined): string[] => {
  if (!envVar) return [];
  try {
    if (envVar.trim().startsWith('[')) {
      const parsed = JSON.parse(envVar);
      if (Array.isArray(parsed)) return parsed.map(k => String(k).trim()).filter(k => k.length > 0);
    }
  } catch (e) {}
  return envVar.split(',').map(k => k.replace(/\\n/g, '').replace(/\n/g, '').trim()).filter(k => k.length > 0);
};

export const GROQ_KEYS = parseKeys(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY);
export const SERPER_KEYS = parseKeys(process.env.SERPER_KEYS || process.env.SERPER_API_KEY);
export const TAVILY_KEYS = parseKeys(process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY);

export class SmartKeyQueue {
  name: string;
  keys: { value: string; cooldownUntil: number }[];

  constructor(name: string, keyStrings: string[]) {
    this.name = name;
    this.keys = keyStrings.map(k => ({ value: k, cooldownUntil: 0 }));
  }

  getValidKey(): string {
    if (this.keys.length === 0) throw new Error(`No ${this.name} keys found.`);

    this.keys.sort((a, b) => a.cooldownUntil - b.cooldownUntil);
    const bestKey = this.keys[0];

    bestKey.cooldownUntil = Math.max(bestKey.cooldownUntil, Date.now()) + 100;

    if (bestKey.cooldownUntil > Date.now() + 1000) {
      console.warn(`⚠️ [${this.name}] All keys exhausted! Forcing best available: ...${bestKey.value.slice(-4)}`);
    } else {
      console.log(`🟢 [${this.name}] Pulled Key: ...${bestKey.value.slice(-4)}`);
    }

    return bestKey.value;
  }

  reportFailure(keyString: string, penaltySeconds: number = 60) {
    if (!keyString) return;
    const keyObj = this.keys.find(k => k.value === keyString);
    if (keyObj) {
      keyObj.cooldownUntil = Date.now() + (penaltySeconds * 1000);
      console.log(`🔴 [${this.name}] PENALTY! Key ...${keyString.slice(-4)} dead for ${penaltySeconds}s`);
    }
  }
}

export const groqQueue = new SmartKeyQueue('Groq', GROQ_KEYS);

let serperIndex = 0;
let tavilyIndex = 0;

// 🚀 STRICT MODEL MAPPING FOR GROQ
export const getGroqModel = (isVision: boolean = false, useInstant: boolean = false) => {
  const key = groqQueue.getValidKey();
  
  // Use official Groq vision model if handling images, otherwise use Llama 3.3 for best tool calling
  const modelName = isVision 
    ? 'llama-3.2-90b-vision-preview' 
    : (useInstant ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile');
  
  const model = new ChatGroq({
    apiKey: key,
    model: modelName,
    temperature: 0.0,
    maxRetries: 0, 
  });
  (model as any)._inferaKey = key;
  return model;
};

export const getSerperKey = () => {
  if (SERPER_KEYS.length === 0) return null;
  const key = SERPER_KEYS[serperIndex % SERPER_KEYS.length];
  serperIndex++;
  return key;
};

export const getTavilyKey = () => {
  if (TAVILY_KEYS.length === 0) return null;
  const key = TAVILY_KEYS[tavilyIndex % TAVILY_KEYS.length];
  tavilyIndex++;
  return key;
};