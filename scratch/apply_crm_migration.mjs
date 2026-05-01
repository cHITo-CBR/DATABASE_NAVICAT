
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'navicat',
  });

  console.log('--- Starting CRM & Scheduling Migration ---');

  try {
    // 1. Add CRM Fields to Customers
    console.log('Updating customers table...');
    await connection.execute(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS status ENUM('prospect', 'active', 'inactive') DEFAULT 'prospect',
      ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'retail'
    `);

    // 2. Link Users to Customers (for Buyer Self-Service)
    console.log('Updating users table...');
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS linked_customer_id VARCHAR(36) NULL
    `);
    
    try {
        await connection.execute(`
          ALTER TABLE users 
          ADD CONSTRAINT fk_user_customer FOREIGN KEY (linked_customer_id) REFERENCES customers(id) ON DELETE SET NULL
        `);
    } catch (e) {
        console.log('Note: Foreign key constraint might already exist or failed due to data. Skipping...');
    }

    // 3. Update Sales Transactions for Buyer Bookings
    console.log('Updating sales_transactions table...');
    await connection.execute(`
      ALTER TABLE sales_transactions 
      ADD COLUMN IF NOT EXISTS is_buyer_initiated TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid'
    `);

    // 4. Create the Appointments/Scheduling Table
    console.log('Creating appointments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        salesman_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        appointment_type ENUM('visit', 'demo', 'collection', 'follow_up') DEFAULT 'visit',
        scheduled_at DATETIME NOT NULL,
        end_at DATETIME NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customer (customer_id),
        INDEX idx_salesman (salesman_id),
        INDEX idx_scheduled (scheduled_at),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (salesman_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('--- Migration Completed Successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
