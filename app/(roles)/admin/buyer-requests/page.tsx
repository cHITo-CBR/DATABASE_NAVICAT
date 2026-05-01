
import { getAllBuyerRequests, approveBuyerRequest } from "@/app/actions/buyer-requests";
import { getPendingStoreRegistrations } from "@/app/actions/users";
import StoreRegistrationRow from "./StoreRegistrationRow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, User } from "lucide-react";
export const dynamic = "force-dynamic";

export default async function AdminBuyerRequestsPage() {
  const [requests, registrations] = await Promise.all([
    getAllBuyerRequests(),
    getPendingStoreRegistrations(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 italic">Buyer <span className="text-orange-500 underline decoration-slate-200">Requests</span></h1>
          <p className="text-slate-500 mt-1 font-medium">Review and process product requests from your registered buyers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Store Registrations</CardTitle>
          <CardDescription>Review and approve new store applications submitted from the registration form.</CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
              No pending store registrations at this time.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration: any) => (
                  <StoreRegistrationRow key={registration.user_id} registration={registration} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <Card className="border-none shadow-sm bg-slate-50 border-2 border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <ShoppingBag className="h-8 w-8 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
              <p className="text-slate-400 text-sm mt-1">There are no pending buyer requests at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request: any) => (
            <Card key={request.id} className="border-none shadow-md overflow-hidden bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-stretch">
                 {/* Left: Customer Info */}
                 <div className="lg:w-1/3 bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl">
                         {request.store_name.charAt(0)}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 leading-tight">{request.store_name}</h4>
                          <div className="flex items-center text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">
                             <User className="h-3 w-3 mr-1" />
                             {request.contact_person}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Requested On</span>
                          <span className="text-slate-700 font-medium">{new Date(request.created_at).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Current Status</span>
                          <Badge variant={request.status === 'pending' ? 'secondary' : 'success'} className="font-black uppercase tracking-tighter italic">
                             {request.status}
                          </Badge>
                       </div>
                    </div>

                    {request.status === 'pending' && (
                       <div className="mt-8 flex gap-2">
                          <form action={async () => {
                             "use server";
                             await approveBuyerRequest(request.id);
                          }} className="flex-1">
                             <Button className="w-full bg-orange-500 hover:bg-orange-600 font-black italic uppercase text-xs tracking-tighter">
                               Approve Request
                             </Button>
                          </form>
                          <Button variant="outline" className="border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold italic uppercase text-xs tracking-tighter">
                             Reject
                          </Button>
                       </div>
                    )}
                 </div>

                 {/* Right: Items */}
                 <div className="flex-1 p-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Request Details ({request.items.length} Items)</h5>
                    <div className="space-y-3">
                       {request.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-orange-200 transition-colors">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                   <ShoppingBag className="h-4 w-4 text-slate-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{item.product_name}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-400 uppercase">Qty</span>
                                <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
