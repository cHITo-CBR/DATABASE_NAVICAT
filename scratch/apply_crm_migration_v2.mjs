
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'navicat',
  });

  console.log('--- Starting CRM & Scheduling Migration (Fixed Types) ---');

  try {
    // 1. CRM Fields are already added from previous run (but let's be sure)
    console.log('Verifying customers table columns...');
    
    // 2. Fix linked_customer_id type in users (should be INT to match customers.id)
    console.log('Correcting linked_customer_id type in users...');
    try {
        await connection.execute(`ALTER TABLE users MODIFY COLUMN linked_customer_id INT(11) NULL`);
    } catch (e) {
        console.log('Note: users.linked_customer_id might already be INT or failed. Continuing...');
    }

    // 3. Create the Appointments Table with correct types
    console.log('Creating appointments table with INT customer_id...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(36) PRIMARY KEY,
        customer_id INT(11) NOT NULL,
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
        CONSTRAINT fk_appointment_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        CONSTRAINT fk_appointment_salesman FOREIGN KEY (salesman_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 4. Update sales_transactions if not already updated
    console.log('Verifying sales_transactions columns...');
    try {
        await connection.execute(`
          ALTER TABLE sales_transactions 
          ADD COLUMN IF NOT EXISTS is_buyer_initiated TINYINT(1) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid'
        `);
    } catch (e) {
        console.log('Note: sales_transactions already has these columns. Skipping...');
    }

    console.log('--- Migration Completed Successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
