
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'navicat',
  });

  try {
    const [cust] = await connection.execute('DESCRIBE customers');
    console.log('--- CUSTOMERS ---');
    console.table(cust);

    const [users] = await connection.execute('DESCRIBE users');
    console.log('--- USERS ---');
    console.table(users);
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkSchema();
