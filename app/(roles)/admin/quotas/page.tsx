import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, TrendingUp, Calendar } from "lucide-react";
import { getQuotas, getCurrentMonthQuotaSummary } from "@/app/actions/quotas";
import QuotaTable from "./quota-table";

export default async function QuotasPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  try {
    const [quotas, summary] = await Promise.all([
      getQuotas({ year: currentYear, month: currentMonth }),
      getCurrentMonthQuotaSummary()
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salesman Quotas</h1>
            <p className="text-gray-600">Manage and track sales targets and performance</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_quotas}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.completed_quotas}</div>
              <p className="text-xs text-muted-foreground">
                {summary.completion_rate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{summary.total_target.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Monthly target
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achieved</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₱{summary.total_achieved.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Current progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quotas Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quota Management</CardTitle>
          </CardHeader>
          <CardContent>
            <QuotaTable quotas={quotas} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Quotas page error:", error);
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quota System Unavailable</h3>
          <p className="text-gray-500 mb-4">Please run the quota migration script first.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Migration Required:</strong><br />
              Run <code>add-quota-system.sql</code> in phpMyAdmin to enable quota functionality.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
