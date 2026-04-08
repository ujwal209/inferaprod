import { toast } from "sonner";
import React, { ReactNode } from 'react';
// 🚀 Import the new Server Action
import { uploadFileToServer } from '@/app/actions/upload'; 

// ==========================================
// 🚀 1. CLOUDINARY SERVER ACTION LOGIC
// ==========================================
export async function uploadFilesDirectly(files: File[], sessionId: string): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      // 🚀 Call the Server Action directly (Bypasses Next.js API Routes entirely)
      const result = await uploadFileToServer(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.url) {
        uploadedUrls.push(result.url);
      }
    } catch (error: any) {
      console.error("File upload error:", error);
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
    }
  }

  return uploadedUrls;
}

// ==========================================
// 🚀 2. MARKDOWN & MATH UTILITIES
// ==========================================

/**
 * Extracts plain text from a React Node (useful for Copy to Clipboard buttons inside Markdown)
 */
export const extractTextFromNode = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (React.isValidElement(node) && node.props && node.props.children) {
    return React.Children.toArray(node.props.children)
      .map(extractTextFromNode)
      .join('');
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join('');
  }
  return '';
};

/**
 * Preprocesses AI text to fix LaTeX delimiters for KaTeX/MathJax rendering.
 * Converts \[ \] to $$ $$ and \( \) to $ $
 */
export const preprocessMath = (content: string): string => {
  if (!content) return '';
  
  // Replace block math \[ ... \] with $$ ... $$
  let processed = content.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
  
  // Replace inline math \( ... \) with $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
  
  return processed;
};