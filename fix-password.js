const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function fixPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'flowstock'
    });

    const newHash = await bcrypt.hash('password123', 10);
    console.log('Generated new hash for password123:', newHash);

    await connection.execute('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, 'admin@flowstock.com']);
    console.log('Password hash updated for admin@flowstock.com.');

    await connection.end();
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

fixPassword();
