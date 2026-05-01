
import { Suspense } from "react";
import { getBuyerDashboardKPIs, getBuyerRecentOrders } from "@/app/actions/buyer-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, CreditCard, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function BuyerDashboardPage() {
  const kpis = await getBuyerDashboardKPIs();
  const recentOrders = await getBuyerRecentOrders();

  if (!kpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold">Store Not Linked</h2>
        <p className="text-muted-foreground mt-2">Your account is not yet linked to a physical store. Please contact your salesman.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">{kpis.storeName}</h1>
          <p className="text-muted-foreground mt-1">Welcome back to your store portal.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-md">
            <Link href="/buyer/catalog">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Book New Session
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Since registration</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{kpis.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Invoices</CardTitle>
            <Badge variant="outline" className={kpis.unpaidInvoices > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
              {kpis.unpaidInvoices} {kpis.unpaidInvoices === 1 ? 'invoice' : 'invoices'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{kpis.unpaidInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Order</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold truncate">
              {kpis.lastOrderDate ? new Date(kpis.lastOrderDate).toLocaleDateString() : "No orders yet"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Visit history</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Orders & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Orders Table */}
        <Card className="md:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>A list of your latest purchases and their delivery status.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground mt-2">You haven't placed any orders yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order: any) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-xs font-mono">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">₱{order.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'completed' ? 'success' : order.status === 'pending' ? 'secondary' : 'outline'} className="capitalize">
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {recentOrders.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                  <Link href="/buyer/orders">
                    View all orders <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support & Quick Actions */}
        <Card className="md:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Customer Support</CardTitle>
            <CardDescription>Need help with your order or stock?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h4 className="font-semibold text-primary">Need a Salesman?</h4>
              <p className="text-sm text-muted-foreground mt-1">You can request a special visit or demonstration session at your store.</p>
              <Button variant="outline" size="sm" className="mt-3 w-full border-primary/20 hover:bg-primary/10 text-primary">
                Schedule Visit
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <h4 className="font-semibold text-emerald-800">Quick Pay</h4>
              <p className="text-sm text-emerald-600 mt-1">Easily settle your outstanding balances via online bank transfer.</p>
              <Button variant="outline" size="sm" className="mt-3 w-full border-emerald-200 hover:bg-emerald-100 text-emerald-800">
                View Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
