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
- Rishi R — Sales and Marketing Executive
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
    description: "Executes a live internet search. Use this ONLY when you need real-time data, news, statistics, or facts that are not in your training data. Do not use this if the answer is already in an uploaded document.",
    schema: z.object({
      keyword: z.string().describe("The precise Google Search query to execute. Expand acronyms and use highly specific keywords (e.g., 'React 18 useId hook documentation' instead of just 'react').")
    })
  }
);

export const founderInfoTool = tool(
  async () => {
    return INFERA_CORE_INFO;
  },
  {
    name: "get_founder_info",
    description: "Retrieves the official internal list of founders, CEO, Managing Director, and key team members for INFERA CORE. Call this if the user asks who built you or who runs the company.",
    schema: z.object({ 
      query: z.string().describe("Always pass the exact string 'team_info'.") 
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
    description: "Triggers a visual interactive Quiz UI for the user. MUST be called whenever the user asks for a quiz, a test, or wants to practice their knowledge.",
    schema: z.object({
      topic: z.string().describe("The specific academic or technical subject of the quiz (e.g., 'Advanced Calculus' or 'Docker Networking')."),
      difficulty: z.enum(['Foundational', 'Intermediate', 'Expert']).describe("The strict difficulty level of the quiz."),
      questions: z.array(
        z.object({
          question: z.string().describe("The text of the quiz question. Must be clear and unambiguous."),
          options: z.array(z.string()).length(4).describe("An array containing exactly 4 string options for the multiple choice question."),
          correctIndex: z.number().min(0).max(3).describe("The integer index (0, 1, 2, or 3) of the correct answer within the options array."),
          explanation: z.string().describe("A 1-2 sentence explanation detailing exactly why the correct answer is right.")
        })
      ).length(10).describe("An array containing exactly 10 distinct question objects. You MUST generate all 10.")
    })
  }
);

export const progressWidgetTool = tool(
  async (args) => {
    return JSON.stringify(args);
  },
  {
    name: "ProgressWidget",
    description: "Triggers a visual Progress Tracking UI for the user. Call this when the user asks to see their roadmap, study plan, or completion status.",
    schema: z.object({
      topic: z.string().describe("The name of the main course or skill being studied."),
      masteryPercentage: z.number().min(0).max(100).describe("The estimated completion percentage of the subject as an integer from 0 to 100."),
      completedConcepts: z.array(z.string()).describe("An array of 3 to 5 strings listing the specific concepts the user has already mastered or covered."),
      nextConcept: z.string().describe("The exact name of the next logical concept or chapter the user needs to study to continue progressing.")
    })
  }
);

// ==========================================
// 🚀 EXPORTS
// ==========================================
export const executableTools = [webSearchTool, founderInfoTool]; 
export const uiTools = [quizWidgetTool, progressWidgetTool];
export const allTools = [...executableTools, ...uiTools];