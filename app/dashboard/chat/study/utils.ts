import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export const formatLatex = (text: string) => {
  if (!text) return text;
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, match) => `$$${match}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, match) => `$${match}$`)
    .replace(/(?:^|\n)\[\s*(\\begin\{[\s\S]*?\\end\{[^}]+\})\s*\](?:$|\n)/g, (_, match) => `\n$$${match}$$\n`)
    .replace(/(?:^|\n)\[\s*(\\(?:mathbf|frac|sum|int|mu|sigma|alpha|beta|text|left)[\s\S]*?)\s*\](?:$|\n)/g, (_, match) => `\n$$${match}$$\n`);
};

export const formatQuizText = (text: string) => {
  if (!text) return text;
  let t = formatLatex(text);
  
  if (!t.includes('$') && !t.includes('\\[') && !t.includes('\\(')) {
     if (/[\^=<>_]|\\[a-zA-Z]+/.test(t) || (t.includes('/') && t.includes('(') && t.includes(')'))) {
        if (!/\b(the|is|of|and|to|in|what|find|calculate|explain|how|why)\b/i.test(t)) {
            return `$${t}$`; 
        }
     }
  }
  return t;
};
