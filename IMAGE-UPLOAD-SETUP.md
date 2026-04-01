# Image Upload Setup Instructions

## ⚠️ IMPORTANT: Follow these steps to fix the errors

### 1. Fix Database Migration Error
The migration script had a duplicate column issue. Run the UPDATED `migration-fix-catalog.sql` in phpMyAdmin.

### 2. Fix Image Upload Error

**Option A: Run Setup Script (Recommended)**
```bash
node setup-uploads.mjs
npm install uuid @types/uuid
```

**Option B: Manual Setup**
If the script doesn't work, create these manually:

1. **Create directories:**
   ```
   mkdir app\api\upload\product-image
   mkdir public\uploads\products
   ```

2. **Create the API route file:**
   Create: `app/api/upload/product-image/route.ts`
   Copy content from `api-route-backup.ts` (I've created this for you)

3. **Install dependencies:**
   ```bash
   npm install uuid @types/uuid
   ```

### 3. What's Been Fixed:

✅ **Database Migration**: Removed duplicate column creation
✅ **Upload API**: Added directory creation in the upload function
✅ **Error Handling**: Better error messages and validation
✅ **Dependencies**: Added uuid package for unique filenames

### 4. Test Steps:

1. Run migration in phpMyAdmin
2. Set up upload directories (Option A or B above)
3. Install dependencies
4. Try uploading an image in the product form
5. Check if image appears in `public/uploads/products/`

### 5. If Still Having Issues:

**Database Error**: Check phpMyAdmin error log
**Image Upload Error**: Check browser console (F12) for specific error messages
**File Permissions**: Ensure `public/uploads/products/` is writable

After completing these steps, both the database and image upload should work correctly!