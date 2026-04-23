'use server'

import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { getGroqModel, getGeminiModel } from './agent/providers';
// Import your massive, elite Study Prompt
import { STUDY_PROMPT } from './agent/prompts';

export async function sendDemoMessage(message: string, history: {role: string, content: string}[] = []) {
  try {
    // Initialize the execution engine
    const model = getGroqModel(); 

    // Map the plain JSON history to LangChain message objects
    const formattedHistory = history.map(msg => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      return new AIMessage(msg.content);
    });

    // Inject a small demo constraint so it doesn't break your UI with a 10-page syllabus
    const demoSystemPrompt = `${STUDY_PROMPT}\n\n<demo_constraint>\nYou are operating in the restricted public landing page demo. \nYou MUST keep your responses highly concise (max 2-3 short paragraphs or a very brief bulleted list) to show off your capabilities without overwhelming the UI. \nYou MUST still use LaTeX for any math, and maintain the elite study-buddy persona.\n</demo_constraint>`;

    // Construct the prompt array using the actual STUDY_PROMPT
    const messages = [
      new SystemMessage(demoSystemPrompt),
      ...formattedHistory,
      new HumanMessage(message)
    ];

    // Execute the chain
    const response = await model.invoke(messages);
    
    return response.content as string;

  } catch (error: any) {
    console.error('Demo connection error:', error?.message || error);
    
    // GRACEFUL FALLBACK
    return `**System Notification:** The demo inference node is currently experiencing high latency.\n\nHowever, in the full platform, I am equipped to break down your query regarding "${message}" with detailed explanations, roadmaps, and instant architectural feedback. Initialize your workspace to access the production execution engines!`;
  }
}