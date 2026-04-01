"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Archive, Edit, Loader2, Inbox } from "lucide-react";
import { getPackagingTypes, createPackagingType, updatePackagingType, archivePackagingType, type PackagingRow } from "@/app/actions/catalog";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function PackagingTypesPage() {
  const [items, setItems] = useState<PackagingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<PackagingRow | null>(null);

  async function loadData() {
    setLoading(true);
    setItems(await getPackagingTypes());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    
    let result;
    if (editingItem) {
      result = await updatePackagingType(editingItem.id, form);
    } else {
      result = await createPackagingType(form);
    }

    setSaving(false);
    if (result.success) { 
      setDialogOpen(false); 
      setEditingItem(null);
      loadData(); 
    }
    else alert(result.error);
  }

  async function handleArchive(id: number) {
    if (!confirm("Archive this packaging type? It will be moved to the System Archives.")) return;
    await archivePackagingType(id);
    loadData();
  }

  function openEditDialog(item: PackagingRow) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingItem(null);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Packaging Settings</h1>
          <p className="text-gray-500 text-sm">Manage packaging settings for product variants.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-[#005914] hover:bg-[#00420f]"><PlusCircle className="w-4 h-4 mr-2" />Add Packaging</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>{editingItem ? "Edit Packaging" : "Add Packaging"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Total Packaging</Label>
                <Input id="name" name="name" required placeholder="e.g. Case of 48" defaultValue={editingItem?.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Net Weight</Label>
                <Input id="description" name="description" placeholder="e.g. 155g" defaultValue={editingItem?.description || ""} />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#005914] hover:bg-[#00420f]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100"><CardTitle className="text-lg font-semibold text-gray-800">All Packaging Limits</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#005914]" /></div>
          ) : items.length === 0 ? (
            <EmptyState message="No packaging limits yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Total Packaging</TableHead>
                  <TableHead>Net Weight</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                    <TableCell className="text-gray-500">{p.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => openEditDialog(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50" onClick={() => handleArchive(p.id)} title="Archive">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
