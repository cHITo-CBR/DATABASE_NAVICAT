import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";

export async function GET(request: NextRequest) {
  try {
    const orders = await query(
      "SELECT id, status, total_amount, notes, created_at FROM sales_transactions ORDER BY created_at DESC"
    );

    const orderIds = orders.map((o: any) => o.id);
    let itemsMap = new Map<string, any[]>();

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const items = await query(
        `SELECT transaction_id, variant_id, quantity, unit_price, subtotal
         FROM sales_transaction_items
         WHERE transaction_id IN (${placeholders})`,
        orderIds
      );

      for (const item of items) {
        if (!itemsMap.has(item.transaction_id)) itemsMap.set(item.transaction_id, []);
        itemsMap.get(item.transaction_id)!.push(item);
      }
    }

    const mapped = orders.map((o: any) => {
      const txItems = itemsMap.get(o.id) || [];
      return {
        ...o,
        product_name: txItems.length > 0 ? `${txItems.length} Item(s)` : "No items",
        quantity: txItems.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
        items: txItems,
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, items } = body;

    let orderItems = items;
    if (!orderItems && body.product_id) {
       orderItems = [{
         product_id: body.product_id,
         quantity: body.quantity,
         price: body.price
       }];
    }

    if (!orderItems || orderItems.length === 0) {
       return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const totalAmount = orderItems.reduce((acc: number, item: any) => acc + (item.quantity * item.price), 0);

    let finalSalesmanId = user_id;
    const validUser = await queryOne("SELECT id FROM users WHERE id = ?", [user_id]);
    if (!validUser) {
       const firstUser = await queryOne("SELECT id FROM users LIMIT 1");
       if (firstUser) finalSalesmanId = firstUser.id;
    }

    const transactionId = generateUUID();

    // Insert into sales_transactions
    await execute(
      `INSERT INTO sales_transactions (id, salesman_id, status, total_amount)
       VALUES (?, ?, 'for_approval', ?)`,
      [transactionId, finalSalesmanId, totalAmount]
    );

    // Insert items
    for (const item of orderItems) {
      await execute(
        `INSERT INTO sales_transaction_items (id, transaction_id, variant_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [generateUUID(), transactionId, item.variant_id || item.product_id,
         item.quantity, item.price, item.quantity * item.price]
      );
    }

    return NextResponse.json({ success: true, order: { id: transactionId } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
