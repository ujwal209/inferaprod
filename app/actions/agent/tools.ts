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
      keyword: z.string().describe("An SEO-optimized, highly specific Google Search query. CRITICAL: Do NOT just use the user's raw input! You MUST auto-correct typos and expand abbreviations to get good results. (e.g., if user says 'bms 2025 placemets', you MUST query 'BMS College of Engineering Bangalore 2024 2025 placement statistics average highest package').")
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
      difficulty: z.enum(['Foundational', 'Intermediate', 'Expert']).describe("Strictly one of: 'Foundational' (0-30%), 'Intermediate' (35-70%), or 'Expert' (75-100%)."),
      questions: z.array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).describe("Provide 4 options here."),
          correctIndex: z.number(),
          explanation: z.string()
        })
      ).describe("Required array of 5 generated quiz questions objects.")
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
      masteryPercentage: z.number().int().min(0).max(100).describe("OVERALL course completion based on the syllabus. Calculated strictly as (completed_items / total_items_in_syllabus) * 100. Max 100."),
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