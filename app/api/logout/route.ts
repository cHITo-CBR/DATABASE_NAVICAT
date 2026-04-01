import { clearSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  // Check if this is a logout request or upload request
  const contentType = request.headers.get('content-type');
  
  if (contentType?.includes('multipart/form-data')) {
    // Handle image upload
    try {
      console.log('Image upload request received');
      
      const formData = await request.formData();
      const file = formData.get('image') as File;

      if (!file) {
        console.log('No file received');
        return NextResponse.json({ error: 'No file received' }, { status: 400 });
      }

      console.log('File details:', { name: file.name, type: file.type, size: file.size });

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        console.log('Invalid file type:', file.type);
        return NextResponse.json({ error: `Invalid file type: ${file.type}. Only JPG, PNG, and WebP are allowed.` }, { status: 400 });
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.log('File too large:', file.size);
        return NextResponse.json({ error: `File too large: ${file.size} bytes. Maximum size is 5MB.` }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename using timestamp and random number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const ext = file.name.split('.').pop();
      const filename = `product_${timestamp}_${random}.${ext}`;
      
      // Create upload directory in public folder
      const publicDir = join(process.cwd(), 'public');
      const uploadsDir = join(publicDir, 'upload');
      const productsDir = join(uploadsDir, 'products');
      
      console.log('Creating directories:', { publicDir, uploadsDir, productsDir });
      
      // Create directories if they don't exist
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
        console.log('Created upload directory');
      }
      
      if (!existsSync(productsDir)) {
        await mkdir(productsDir, { recursive: true });
        console.log('Created products directory');
      }
      
      const filepath = join(productsDir, filename);
      console.log('Saving file to:', filepath);

      await writeFile(filepath, buffer);
      console.log('File saved successfully');

      // Return the URL path (relative to public)
      const imageUrl = `/upload/products/${filename}`;
      console.log('Image URL:', imageUrl);

      return NextResponse.json({ 
        success: true, 
        imageUrl,
        filename 
      });

    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ 
        error: `Upload failed: ${error.message}`,
        details: error.toString()
      }, { status: 500 });
    }
  } else {
    // Handle logout
    await clearSession();
    redirect("/login");
  }
}
