'use server'

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your secure credentials
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFileToServer(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return { error: 'No file provided' };
    }

    console.log(`[SERVER ACTION] Processing file: ${file.name}`);

    // Convert the File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto', // Auto-handles images, pdfs, docs
      folder: 'infera_uploads',
    });

    console.log(`[SERVER ACTION] Success! URL: ${uploadResponse.secure_url}`);
    
    return { url: uploadResponse.secure_url };
    
  } catch (error: any) {
    console.error("[SERVER ACTION] Error:", error);
    return { error: error.message || "Failed to upload file to Cloudinary" };
  }
}