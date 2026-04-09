# CPF Supply Chain & Inventory System

This document outlines the core architecture, functionality, and role-based logic of the Inventory & Sales application built with Next.js and TiDB (MySQL Compatible).

---

## 🏗 System Architecture 

This system uses a **Role-Based Access Control (RBAC)** architecture to route users to isolated sub-applications upon logging in. Each permission level provides targeted functionality specific to the user's operational needs.

The hierarchical flow of data generally moves from **Buyers** (Placing Orders/Bookings) &rarr; **Salesmen** (Managing Customer Accounts) &rarr; **Supervisors** (Team Oversight & Reporting) &rarr; **Admins** (Full System/Enterprise Control).

---

## 👥 Role Logic & Functionalities

### 1. 🛡️ Administrator (Admin)
**Role:** Supreme control over the entire ecosystem. Admins are generally IT personnel or high-level operations managers.

**Key Functionalities:**
- **Enterprise Dashboard:** High-level strategic overview including Total Earnings, Successful Orders, Pipeline Growth, and Live Hub Status.
- **User & Approval Management:** Approving new account registrations to ensure only authorized personnel and clients gain entry. Full control over user role assignment (`/admin/users`, `/admin/approvals`).
- **Inventory & Catalog Master Control:** Full CRUD capabilities for adding new SKUs, modifying existing product packages/pricing, restocking, and archiving (`/admin/inventory`, `/admin/catalog`).
- **Sales & Bookings Management:** View all incoming transactions/bookings, alter their statuses (e.g., to "Completed"), and track the entire sales pipeline (`/admin/sales`, `/admin/bookings`).
- **Audit Logging:** Access to system-wide audit logs to track changes, ensuring accountability and security (`/admin/audit`).
- **Team & Operational Configs:** Setting quotas, scheduling, and adjusting global settings.

---

### 2. 👔 Supervisor
**Role:** Mid-level management. Supervisors oversee regional or team-based sales and inventory flow.

**Key Functionalities:**
- **Team Management:** Ability to track and review the performance of Salesmen under their branch (`/supervisor/team`).
- **Sales & Reporting:** Deep dive into recent sales performance, quota tracking, and compiling status reports for upper management (`/supervisor/reports`, `/supervisor/sales`).
- **Inventory Oversight:** Able to monitor live stock tracking (balance counts, low stock alerts) to proactively prevent shortages (`/supervisor/inventory`).
- **Route / Visit Oversight:** Track salesmen's customer visits and logistical routes (`/supervisor/visits`).

---

### 3. 💼 Salesman
**Role:** Field operatives. Focused strictly on customer relationship management (CRM) and fulfilling/capturing incoming sales.

**Key Functionalities:**
- **Customer Management:** Maintain specific client accounts, ensuring store partners are satisfied (`/salesman/customers`).
- **Bookings & Requests:** Input and handle physical or direct-to-salesman bookings, adjusting fulfillment statuses (`/salesman/bookings`, `/salesman/requests`).
- **Visit Scheduling:** Managing their daily/weekly route planning to interact physically with store owners and buyers (`/salesman/visits`).
- **Notifications:** Receive alerts when customers file complaints, request goods, or need approval.

---

### 4. 🛒 Buyer (Customer)
**Role:** External store owners or bulk purchasers who consume the application as a B2B platform.

**Key Functionalities:**
- **Product Catalog Browsing:** View available inventory SKUs, dynamic pricing, and stock availability statuses (`/customers/catalog`).
- **Order Booking:** Seamlessly submit booking requests or direct orders to the supply chain (`/customers/bookings`, `/customers/buyer-requests`).
- **Profile Management:** Manage their store's shipping details, contact information, and business credentials (`/customers/profile`).
- **Personalized Dashboard:** View past transaction history, pending order statuses, and receive notifications on their fulfillment (`/customers/dashboard`).

---

## 🔒 Security & Data Flow
- **TiDB Cloud Security:** The system leverages a distributed MySQL-compatible database (TiDB) with SSL encryption for secure data handling.
- **Middleware Auth:** Next.js middleware and JWT/Session strategies route users to their respective dashboards based on roles stored in the database.
- **Real-Time Data Integration:** All Dashboards calculate dynamic views like Pipeline Growth and Operational Health based on live transaction data.

---

## 🚀 Deployment Guide (Vercel + TiDB Cloud)

Follow these steps to deploy the application to Vercel using TiDB Cloud as your database.

### 1. 🗄️ TiDB Cloud Setup
1.  **Sign Up:** Create an account at [PingCAP TiDB Cloud](https://tidbcloud.com/).
2.  **Create Cluster:** Choose **TiDB Serverless** (Free Tier).
3.  **Get Connection Details:** 
    *   Go to your cluster dashboard.
    *   Click **Connect**.
    *   Choose **Connect with MySQL CLI** or **Node.js** to see your credentials.
    *   **Note your:** Host, Port (usually 4000), User, Password, and Database name.

### 2. 🏗️ Database Initialization
1.  In the TiDB Cloud console, go to **SQL Editor**.
2.  Open the `mysql-schema.sql` file from this project.
3.  Copy and paste the entire script into the SQL Editor and click **Run**.
4.  (Optional) Run `admin-seeder.sql` to create your initial global administrator.

### 3. 🌐 Vercel Deployment
1.  **Push Code:** Ensure your latest code is pushed to a GitHub/GitLab repository.
2.  **Import to Vercel:** Go to [Vercel](https://vercel.com/) and click **Add New > Project**.
3.  **Environment Variables:** During the configuration step, add the following variables:
    *   `DB_HOST`: Your TiDB Host (e.g., `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
    *   `DB_PORT`: `4000`
    *   `DB_USER`: Your TiDB User
    *   `DB_PASSWORD`: Your TiDB Password
    *   `DB_NAME`: Your Database Name (e.g., `inventory`)
    *   `DB_SSL`: `true` (This is mandatory for TiDB Cloud)
    *   `JWT_SECRET`: A long random string for auth security.
    *   `CLOUDINARY_CLOUD_NAME`: (If using image uploads)
    *   `CLOUDINARY_API_KEY`: (If using image uploads)
    *   `CLOUDINARY_API_SECRET`: (If using image uploads)

### 4. ✅ Verification
1.  Once deployed, navigate to your Vercel URL.
2.  The application should now be connected to your live TiDB cluster.
3.  Test your login flow with the credentials created in the seeder step.