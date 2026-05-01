import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Phone, Building2, Clock, Mail, ChevronLeft, Navigation, Receipt } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditCustomerDialog } from "./edit-customer-dialog";

export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  // Await the params to resolve Next.js 15+ warnings if needed, but standard behavior here:
  const customerId = (await params).id;

  // Fetch Customer
  const customer = await queryOne(
    `SELECT c.*, u.full_name as salesman_name
     FROM customers c
     LEFT JOIN users u ON c.assigned_salesman_id = u.id
     WHERE c.id = ?`,
    [customerId]
  );

  if (!customer) {
    return <div className="p-10 text-center text-gray-500">Customer not found.</div>;
  }

  // Fetch recent orders
  const orders = await query(
    `SELECT st.*, u.full_name as salesman_name
     FROM sales_transactions st
     LEFT JOIN users u ON st.salesman_id = u.id
     WHERE st.customer_id = ?
     ORDER BY st.created_at DESC
     LIMIT 10`,
    [customerId]
  );

  // Fetch recent visits
  const visits = await query(
    `SELECT sv.*, u.full_name as salesman_name
     FROM store_visits sv
     LEFT JOIN users u ON sv.salesman_id = u.id
     WHERE sv.customer_id = ?
     ORDER BY sv.visit_date DESC
     LIMIT 10`,
    [customerId]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{customer.store_name}</h1>
            <p className="text-gray-500 text-sm">Customer Record & History Overview</p>
          </div>
        </div>
        <EditCustomerDialog customer={customer} />
      </div>

      {/* Info Card */}
      <Card className="border-0 shadow-sm rounded-2xl relative overflow-hidden ring-1 ring-gray-100">
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50 pointer-events-none" />
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Building2 className="w-4 h-4" /></div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Store Name</p>
                   <p className="text-sm font-semibold text-gray-900 mt-1">{customer.store_name}</p>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Mail className="w-4 h-4" /></div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Person</p>
                   <p className="text-sm font-semibold text-gray-900 mt-1">{customer.contact_person || 'N/A'}</p>
                   {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
                 </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><MapPin className="w-4 h-4" /></div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</p>
                   <p className="text-sm font-semibold text-gray-900 mt-1">{customer.address || "No Address"}</p>
                   <p className="text-xs text-gray-500">{customer.city} {customer.region}</p>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Phone className="w-4 h-4" /></div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                   <p className="text-sm font-semibold text-gray-900 mt-1">{customer.phone || 'N/A'}</p>
                 </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-100">
          <CardHeader className="border-b border-gray-50 flex flex-row items-center gap-2 py-4">
            <div className="p-1.5 bg-green-50 text-green-700 rounded-md"><Receipt className="w-4 h-4" /></div>
            <CardTitle className="text-base font-bold text-gray-800">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(!orders || orders.length === 0) ? (
               <div className="py-8 text-center text-sm text-gray-400 font-medium">No order history found.</div>
            ) : (
               <Table>
                 <TableHeader className="bg-gray-50/50">
                   <TableRow>
                     <TableHead className="text-xs uppercase">Date</TableHead>
                     <TableHead className="text-xs uppercase">Salesman</TableHead>
                     <TableHead className="text-right text-xs uppercase">Amount</TableHead>
                     <TableHead className="text-xs uppercase">Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {orders.map((o: any) => (
                     <TableRow key={o.id} className="hover:bg-gray-50/50">
                       <TableCell className="text-sm text-gray-600 font-medium">
                         {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                       </TableCell>
                       <TableCell className="text-sm text-gray-600">{o.salesman_name || 'N/A'}</TableCell>
                       <TableCell className="text-right font-bold text-[#005914]">
                         ₱{o.total_amount?.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </TableCell>
                       <TableCell>
                         <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-gray-100 text-gray-600">
                           {o.status}
                         </span>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Visits */}
        <Card className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-100">
          <CardHeader className="border-b border-gray-50 flex flex-row items-center gap-2 py-4">
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-md"><Navigation className="w-4 h-4" /></div>
            <CardTitle className="text-base font-bold text-gray-800">Recent Visits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(!visits || visits.length === 0) ? (
               <div className="py-8 text-center text-sm text-gray-400 font-medium">No visit history found.</div>
            ) : (
               <Table>
                 <TableHeader className="bg-gray-50/50">
                   <TableRow>
                     <TableHead className="text-xs uppercase">Date</TableHead>
                     <TableHead className="text-xs uppercase">Salesman</TableHead>
                     <TableHead className="text-xs uppercase">Notes</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {visits.map((v: any) => (
                     <TableRow key={v.id} className="hover:bg-gray-50/50">
                       <TableCell className="text-sm text-gray-600 font-medium">
                         <div className="flex items-center gap-1.5 min-w-max">
                           <Clock className="w-3 h-3 text-gray-400" />
                           {new Date(v.visit_date || v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                         </div>
                       </TableCell>
                       <TableCell className="text-sm text-gray-600">{v.salesman_name || 'N/A'}</TableCell>
                       <TableCell className="text-xs text-gray-500 italic max-w-[200px] truncate" title={v.notes || 'No notes'}>
                         {v.notes ? `"${v.notes}"` : '—'}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}