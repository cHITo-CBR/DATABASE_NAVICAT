import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setupDirectories() {
  try {
    console.log('Setting up image upload directories...');
    
    // Create directories
    await fs.mkdir(join(__dirname, 'app', 'api', 'upload', 'product-image'), { recursive: true });
    console.log('✓ Created app/api/upload/product-image/');
    
    await fs.mkdir(join(__dirname, 'public', 'uploads', 'products'), { recursive: true });
    console.log('✓ Created public/uploads/products/');
    
    // Read the upload-api-route.ts file and move it
    try {
      const sourceFile = join(__dirname, 'upload-api-route.ts');
      const content = await fs.readFile(sourceFile, 'utf-8');
      
      // Write to the new location
      const destFile = join(__dirname, 'app', 'api', 'upload', 'product-image', 'route.ts');
      await fs.writeFile(destFile, content, 'utf-8');
      console.log('✓ API route created at app/api/upload/product-image/route.ts');
      
      // Remove the old file
      await fs.unlink(sourceFile);
      console.log('✓ Removed upload-api-route.ts from root');
    } catch (error) {
      console.log('⚠ Upload route file not found or already moved');
    }
    
    // Create .gitkeep file
    await fs.writeFile(
      join(__dirname, 'public', 'uploads', 'products', '.gitkeep'),
      '# This directory is used for product image uploads\n'
    );
    console.log('✓ Created .gitkeep file in uploads directory');
    
    console.log('\n🎉 Setup complete! Image upload should now work.');
    console.log('\nNext steps:');
    console.log('1. Run the updated migration-fix-catalog.sql in phpMyAdmin');
    console.log('2. Run: npm install uuid @types/uuid');
    console.log('3. Test image upload in the product form');
    
  } catch (error) {
    console.error('❌ Error setting up directories:', error);
    process.exit(1);
  }
}

setupDirectories();