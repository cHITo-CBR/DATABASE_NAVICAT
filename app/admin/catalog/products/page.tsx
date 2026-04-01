"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search, PackageOpen, Loader2, Inbox, Edit, Archive } from "lucide-react";
import { getProducts, createProduct, updateProduct, archiveProduct, type ProductRow } from "@/app/actions/products";
import { getCategories, getBrands, type CategoryRow, type BrandRow } from "@/app/actions/catalog";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const data = await getProducts(search);
    setProducts(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    Promise.all([getCategories(), getBrands()]).then(([cats, brs]) => {
      setCategories(cats);
      setBrands(brs);
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = editingProduct 
      ? await updateProduct(editingProduct.id, form)
      : await createProduct(form);
      
    setSaving(false);
    if (result.success) {
      setDialogOpen(false);
      loadProducts();
    } else {
      alert(result.error || "Failed to save product.");
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Are you sure you want to archive this product?")) return;
    await archiveProduct(id);
    loadProducts();
  }

  function openEditDialog(product: ProductRow) {
    setEditingProduct(product);
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingProduct(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product Master Catalog</h1>
          <p className="text-gray-500 text-sm">Manage products, their relationships to categories/brands, and product variants.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#005914] hover:bg-[#00420f]">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product details below." : "Create a new product in the catalog."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Century Tuna Flakes" defaultValue={editingProduct?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Product description" defaultValue={editingProduct?.description || ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPackaging">Total Packaging</Label>
                <Input id="totalPackaging" name="totalPackaging" placeholder="e.g. Box of 48" defaultValue={editingProduct?.total_packaging || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="netWeight">Net Weight</Label>
                <Input id="netWeight" name="netWeight" placeholder="e.g. 155g" defaultValue={editingProduct?.net_weight || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select name="categoryId" defaultValue={
                editingProduct ? categories.find(c => c.name === editingProduct.product_categories?.name)?.id.toString() : undefined
              }>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <Select name="brandId" defaultValue={
                editingProduct ? brands.find(b => b.name === editingProduct.brands?.name)?.id.toString() : undefined
              }>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-[#005914] hover:bg-[#00420f]" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="flex gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search SKU, name, or brand..."
                className="pl-9 h-9 border-gray-200 bg-gray-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#005914]" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState message="No active products found" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Total Packaging</TableHead>
                  <TableHead>Net Weight</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                          <PackageOpen className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="font-semibold text-[#005914]">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{p.product_categories?.name ?? "—"}</TableCell>
                    <TableCell className="text-gray-500 font-medium">{p.brands?.name ?? "—"}</TableCell>
                    <TableCell className="text-gray-500">{p.total_packaging || "—"}</TableCell>
                    <TableCell className="text-gray-500">{p.net_weight || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)} className="text-[#005914] hover:bg-[#E2EBE5]">
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleArchive(p.id)} className="text-red-600 hover:bg-red-50">
                          <Archive className="w-4 h-4 mr-1" /> Archive
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
