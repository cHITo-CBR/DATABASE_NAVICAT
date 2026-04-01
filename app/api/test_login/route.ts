import { queryOne } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2/promise";

export async function GET() {
  try {
    const user = await queryOne<RowDataPacket>(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      ["admin@flowstock.com"]
    );

    return Response.json({ user, error: null });
  } catch (error: any) {
    return Response.json({ user: null, error: error.message });
  }
}
