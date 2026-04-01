"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, Loader2, Inbox } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from "recharts";
import { getSalesTrends, getTopCategories, type SalesTrendPoint, type CategorySalesPoint } from "@/app/actions/reports";

const PIE_COLORS = ["#005914", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export default function ReportsAnalyticsPage() {
  const [trends, setTrends] = useState<SalesTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategorySalesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSalesTrends(), getTopCategories()]).then(([t, c]) => {
      setTrends(t);
      setCategories(c);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 text-sm">Visual representations of sales trends and category performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-0 rounded-xl lg:col-span-2">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#005914]" />
              Sales Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-80">
            {trends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Inbox className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">No sales data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, "Sales"]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="total" fill="#005914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#005914]" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-80">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Inbox className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">No category data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value: number) => [`₱${value.toLocaleString()}`, "Sales"]} />
                </RPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
