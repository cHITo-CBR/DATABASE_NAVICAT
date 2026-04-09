import bcrypt from "bcryptjs";

const password = "password123";
const hash = await bcrypt.hash(password, 10);

console.log("Password:", password);
console.log("Hash:", hash);
console.log("\nRun this SQL in your database:");
console.log(`
USE navicat;

UPDATE users 
SET password_hash = '${hash}',
    is_active = 1, 
    status = 'approved', 
    role_id = 1
WHERE email = 'admin@flowstock.com';
`);
