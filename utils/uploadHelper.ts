/**
 * 🚀 DIRECT CLOUDINARY UPLOAD HELPER
 * This utility handles direct client-side uploads to Cloudinary to bypass Vercel serverless payload limits.
 */
export const uploadFilesDirectly = async (files: File[], sessionId: string, signal?: AbortSignal) => {
  if (files.length === 0) return [];

  // Cloudinary credentials (fallback to defaults if env vars are missing)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dyiajizgh';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'infracore';

  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // Optional: Add metadata for context if needed
    // formData.append('context', `session_id=${sessionId}`);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
      signal
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary Upload Error:", errorData);
      throw new Error(`Upload Failed: ${file.name}`);
    }

    const data = await response.json();
    return data.secure_url as string;
  });
  
  return Promise.all(uploadPromises);
};
