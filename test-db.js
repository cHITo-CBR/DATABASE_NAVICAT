const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Connecting to MySQL at', process.env.MYSQL_HOST, 'port', process.env.MYSQL_PORT);
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'flowstock'
    });

    console.log('Connection successful!');

    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@flowstock.com']);
    
    if (rows.length === 0) {
      console.log('User admin@flowstock.com not found.');
    } else {
      const user = rows[0];
      console.log('User found:', user.email);
      
      const passwordMatch = await bcrypt.compare('password123', user.password_hash);
      console.log('Password "password123" matches hash?', passwordMatch);
      if (!passwordMatch) {
         console.log('Actual hash in DB:', user.password_hash);
      }
    }

    await connection.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();
