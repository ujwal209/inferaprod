'use server'

export async function chatWithRoadmap(roadmapTitle: string, curriculum: any, message: string) {
  console.log("AI received request for:", roadmapTitle); // Terminal Log

  if (!process.env.GROQ_API_KEY) {
    console.error("Missing GROQ_API_KEY in environment variables");
    return { success: false, error: "AI Configuration missing" };
  }

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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // High-speed model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Groq API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    return { 
      success: true, 
      answer: data.choices[0].message.content 
    };

  } catch (error: any) {
    console.error("Server Action Crash:", error);
    return { success: false, error: "Failed to connect to AI" };
  }
}