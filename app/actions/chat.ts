'use server'

import { getGeminiModel } from './agent/providers'
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function chatWithRoadmap(roadmapTitle: string, curriculum: any, message: string) {
  console.log("AI received request for:", roadmapTitle); // Terminal Log

  try {
    const systemPrompt = `
      You are the "Node AI" engineering mentor. 
      Context: You are guiding a student through the "${roadmapTitle}" roadmap.
      Curriculum Data: ${JSON.stringify(curriculum)}
      
      Instructions:
      1. Be extremely concise. 
      2. If asked about a step, explain the technical concepts simply.
      3. If asked for code, provide short snippets.
      4. Stay focused ONLY on this roadmap.
    `;

    const llm = getGeminiModel();
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(message)
    ]);

    return { 
      success: true, 
      answer: response.content 
    };

  } catch (error: any) {
    console.error("Server Action Crash:", error);
    return { success: false, error: "Failed to connect to AI" };
  }
}