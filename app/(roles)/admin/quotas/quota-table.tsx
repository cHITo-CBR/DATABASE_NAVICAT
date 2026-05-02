"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Plus, Trash2 } from "lucide-react";
import { QuotaRow } from "@/app/actions/quotas";
import QuotaFormDialog from "./quota-form-dialog";

interface QuotaTableProps {
  quotas: QuotaRow[];
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const dynamicStatusColors = {
  "Achieved": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "On Track": "bg-blue-100 text-blue-800 border-blue-200",
  "Below Target": "bg-amber-100 text-amber-800 border-amber-200",
  "Pending": "bg-gray-100 text-gray-800 border-gray-200"
};

export default function QuotaTable({ quotas }: QuotaTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuota, setEditingQuota] = useState<QuotaRow | null>(null);

  const handleEdit = (quota: QuotaRow) => {
    setEditingQuota(quota);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingQuota(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingQuota(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Current Month Quotas</h3>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Quota
        </Button>
      </div>

      {quotas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No quotas set for this month.</p>
          <Button onClick={handleAddNew} variant="outline" className="mt-2">
            Set Your First Quota
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Salesman</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Target Amount</TableHead>
                <TableHead>Achieved</TableHead>
                <TableHead>Live Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotas.map((quota) => {
                const progressPercentage = quota.amount_percentage || 0;
                
                return (
                  <TableRow key={quota.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900">{quota.salesman_name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{quota.salesman_email}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <p className="font-medium text-gray-700">{monthNames[quota.month - 1]} {quota.year}</p>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-bold">₱{quota.target_amount?.toLocaleString() || "—"}</p>
                        {quota.target_orders && (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{quota.target_orders} orders</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">₱{quota.achieved_amount.toLocaleString()}</p>
                        {quota.achieved_orders > 0 && (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{quota.achieved_orders} orders</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1.5 w-full min-w-[120px]">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className={`${
                            quota.dynamicStatus === "Achieved" ? "text-emerald-600" :
                            quota.dynamicStatus === "On Track" ? "text-blue-600" :
                            quota.dynamicStatus === "Below Target" ? "text-amber-600" :
                            "text-gray-400"
                          }`}>{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              quota.dynamicStatus === "Achieved" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
                              quota.dynamicStatus === "On Track" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" :
                              quota.dynamicStatus === "Below Target" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" :
                              "bg-gray-300"
                            }`} 
                            style={{ width: `${Math.min(100, progressPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`font-black tracking-tighter text-[10px] uppercase py-0.5 px-2 ${dynamicStatusColors[quota.dynamicStatus || "Pending"]}`}
                      >
                        {quota.dynamicStatus || "Pending"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-900"
                        onClick={() => handleEdit(quota)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <QuotaFormDialog 
        open={dialogOpen}
        onClose={handleCloseDialog}
        quota={editingQuota}
      />
    </div>
  );
}
