import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { runRobustSearch } from './search';

const INFERA_CORE_INFO = `
INFERA CORE — Official Team & Founding Information
====================================================
Founder & CEO: K. V. Maheedhara Kashyap (NMIT, Bangalore)
Co-Founder: Rahul C A (NMIT, Bangalore)
Managing Director: Ujwal (BMS College of Engineering, Bangalore)

Data Science & Analytics Team:
- Pratham S — Data Scientist
- Karan Sable — Data Analyst
- Harshavardhana P M — Data Architect

Sales & Marketing:
- R Rishi — Sales and Marketing Executive
`;

// ==========================================
// EXECUTABLE BACKEND TOOLS
// ==========================================
export const webSearchTool = tool(
  async ({ keyword }) => {
    return await runRobustSearch(keyword);
  },
  {
    name: "web_search",
    description: "Search the live internet using Both Google Search & AI Search with Deep Scraping. 🚨 PRIORITIZE PDF: If a document was uploaded, check it thoroughly first. Use this tool only for missing details or live facts.",
    schema: z.object({
      keyword: z.string().describe("An SEO-optimized, highly specific Google Search query. CRITICAL: Do NOT just use the user's raw input! You MUST auto-correct typos and expand abbreviations to get good results.")
    })
  }
);

export const founderInfoTool = tool(
  async () => {
    return INFERA_CORE_INFO;
  },
  {
    name: "get_founder_info",
    description: "Returns authoritative information about the INFERA CORE team.",
    schema: z.object({ 
      query: z.string().describe("A short string describing your query. Just say 'founders' or 'team'.") 
    })
  }
);

// ==========================================
// UI WIDGET TOOLS
// ==========================================
export const quizWidgetTool = tool(
  async (args) => {
    return JSON.stringify(args);
  },
  {
    name: "QuizWidget",
    description: "Generates an interactive 10-question quiz widget.",
    schema: z.object({
      topic: z.string().describe("The main topic being tested."),
      difficulty: z.string().describe("Strictly one of: 'Foundational', 'Intermediate', or 'Expert'."),
      questions: z.array(
        z.object({
          question: z.string().describe("The actual quiz question."),
          options: z.array(z.string()).describe("Provide exactly 4 options here."),
          correctIndex: z.number().describe("The index of the correct option (0, 1, 2, or 3)."),
          explanation: z.string().describe("A brief explanation of why the answer is correct.")
        })
      ).describe("Required array of exactly 10 generated quiz questions objects.")
    })
  }
);

export const progressWidgetTool = tool(
  async (args) => {
    return JSON.stringify(args);
  },
  {
    name: "ProgressWidget",
    description: "Generates a progress tracking widget.",
    schema: z.object({
      topic: z.string().describe("The overarching subject currently being studied."),
      masteryPercentage: z.number().describe("OVERALL course completion based on the syllabus. Max 100."),
      completedConcepts: z.array(z.string()).describe("List of specific micro-concepts the user has successfully learned so far"),
      nextConcept: z.string().describe("The name of the very next concept to learn from the syllabus")
    })
  }
);

// ==========================================
// 🚀 EXPORTS
// ==========================================
export const executableTools = [webSearchTool, founderInfoTool]; 
export const uiTools = [quizWidgetTool, progressWidgetTool];
export const allTools = [...executableTools, ...uiTools];